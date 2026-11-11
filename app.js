function initGrootEveryStepStudio() {
  const $ = id => document.getElementById(id);
  const canvas = $('iconCanvas'), ctx = canvas.getContext('2d');

  let generatedXaml = '';
  let generatedSelectFromListXaml = '';
  let generatedPy = '';

  const patterns = [
    ['transfer', /(?:view|sheet|viewport).{0,55}(?:transfer|copy|move|duplicate)|(?:transfer|copy|move|duplicate).{0,55}(?:view|sheet|viewport)/gi],
    ['clash', /clash|interference|collision|conflict|coordination|navisworks|overlap/gi],
    ['stairs', /stair|riser|tread|stairpath|stair_path|up.?down/gi],
    ['schedule', /schedule|schedul|tabular|table|takeoff|quantity|qty/gi],
    ['sheets', /sheet|title.?block|drawing.?list|sheet.?number|viewport|print.?set/gi],
    ['views', /view|section|elevation|plan.?view|callout|crop.?region|view.?template/gi],
    ['walls', /wall|floor|ceiling|roof|column|beam|element|host.?object/gi],
    ['tag', /tag|annotation|text.?note|keynote|callout.?tag/gi],
    ['dimension', /dimension|spot.?elevation|measure|length.?value/gi],
    ['level', /level|datum|grid.?line|reference.?plane/gi],
    ['family', /family|nested|generic.?model|load.?family|parameter.?binding/gi],
    ['export', /export|publish|save.?as|write.?file|csv|excel|xlsx|pdf|dwg|ifc/gi],
    ['import', /import|read.?file|load.?data|csv.?reader|excel.?reader|link.?file/gi]
  ];

  const operationProfiles = {
    view_transfer: { title: 'Transfer Views / Sheets', art: 'view_transfer' },
    viewport_place: { title: 'Place Viewport on Sheet', art: 'viewport_place' },
    view_duplicate: { title: 'Duplicate Revit Views', art: 'view_duplicate' },
    view_template: { title: 'Copy / Apply View Templates', art: 'view_template' },
    schedule_create: { title: 'Schedule Export / Creation', art: 'schedule_create' },
    sheet_create: { title: 'Drawing Sheet Automation', art: 'sheet_create' },
    stair_path: { title: 'Stair Path Automation', art: 'stair_path' },
    tag_create: { title: 'Place Tags / Annotations', art: 'tag_create' },
    dimension_create: { title: 'Dimension Automation', art: 'dimension_create' },
    clash_detection: { title: 'Clash Detection', art: 'clash_detection' },
    wall_adjust: { title: 'Element / Section Adjust', art: 'wall_adjust' },
    element_move: { title: 'Move / Copy Elements', art: 'element_move' },
    family_instance: { title: 'Family Placement', art: 'family_instance' },
    export_file: { title: 'Export Revit Data', art: 'export_file' },
    import_file: { title: 'Import External Data', art: 'import_file' },
    level_create: { title: 'Level & Datum Management', art: 'level_create' },
    parameter_update: { title: 'Revit Element Automation', art: 'parameter_update' }
  };

  function detectOperationKey(source) {
    const t = String(source || '');
    const has = re => re.test(t);
    if (has(/ViewDuplicateOption|\.Duplicate\s*\(/i) && has(/View|view/i)) return 'view_duplicate';
    if (has(/ViewTemplateId|ViewTemplate|ApplyViewTemplate/i)) return 'view_template';
    if (has(/(?:ViewSheet|Viewport|View).{0,100}(?:transfer|copy|move|duplicate)|(?:transfer|copy|move|duplicate).{0,100}(?:ViewSheet|Viewport|View)|CopyElements[\s\S]{0,180}(?:View|Sheet)/i)) return 'view_transfer';
    if (has(/Viewport\.Create|CreateViewport\s*\(/i)) return 'viewport_place';
    if (has(/Stairs?Path|stair[_\s-]*path|up[_\s-]*down[_\s-]*path/i)) return 'stair_path';
    if (has(/ScheduleView\.CreateSchedule|CreateSchedule\s*\(|ScheduleSheetInstance\.Create|schedule/i)) return 'schedule_create';
    if (has(/ViewSheet\.Create|CreateSheet\s*\(/i)) return 'sheet_create';
    if (has(/IndependentTag\.Create|NewTag\s*\(|RoomTag|Generic\s*Annotation|tag/i)) return 'tag_create';
    if (has(/NewDimension|Dimension\.Create/i)) return 'dimension_create';
    if (has(/clash|interference|collision|BooleanOperationsUtils/i)) return 'clash_detection';
    if (has(/ElementTransformUtils\.MoveElement|Location\.Move/i)) return 'element_move';
    if (has(/NewFamilyInstance|FamilyInstance|LoadFamily/i)) return 'family_instance';
    if (has(/Export\s*\(|PrintManager|SaveAs|xlsx|csv/i)) return 'export_file';
    if (has(/Import\s*\(|Link\s*\(/i)) return 'import_file';
    if (has(/Level\.Create|NewLevel/i)) return 'level_create';

    const body = t.toLowerCase();
    const scored = patterns.map(([key, re]) => {
      re.lastIndex = 0;
      const m = body.match(re);
      return { key, score: m ? m.length : 0 };
    }).sort((a, b) => b.score - a.score);

    const best = scored[0] && scored[0].score > 0 ? scored[0].key : 'gear';
    const map = {
      transfer: 'view_transfer', stairs: 'stair_path', schedule: 'schedule_create',
      sheets: 'sheet_create', views: 'view_template', walls: 'wall_adjust',
      tag: 'tag_create', dimension: 'dimension_create', family: 'family_instance',
      export: 'export_file', import: 'import_file', clash: 'clash_detection', level: 'level_create'
    };
    return map[best] || 'parameter_update';
  }

  function escapeXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function processUploadedScript(text, fileName) {
    // Strip any previous Groot block cleanly
    let cleanedCode = text.replace(/# --- GROOT UI START ---[\s\S]*?# --- GROOT UI END ---\r?\n?/g, '');
    cleanedCode = cleanedCode.replace(/\n# Apply Step 1 Groot UI parameter values[\s\S]*$/g, '');
    cleanedCode = cleanedCode.replace(/\n_groot_show_final_summary\(\)\s*$/g, '');

    const opKey = detectOperationKey(cleanedCode);
    const opProfile = operationProfiles[opKey] || operationProfiles.parameter_update;

    // Extract step titles from the user's script (e.g. title="Step 1: Select Generic Annotation to Place")
    const stepTitles = [...cleanedCode.matchAll(/title\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
    const btnNames = [...cleanedCode.matchAll(/button_name\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);

    const firstStepTitle = stepTitles[0] || opProfile.title;
    const firstBtnName = btnNames[0] || 'Select & Continue ->';

    generatedSelectFromListXaml = buildGrootSelectFromListXaml(firstStepTitle);
    generatedXaml = generatedSelectFromListXaml;
    generatedPy = buildNonIntrusiveGrootThemeHookPy(cleanedCode, firstStepTitle);

    $('fileNameText').textContent = fileName;
    $('detectedOpText').textContent = opProfile.title;
    $('detectedStepsText').textContent = stepTitles.length > 0
      ? `${stepTitles.length} Step(s) (${stepTitles.slice(0, 3).join(' → ')})`
      : 'All SelectFromList, Input, Switch & Alert steps';

    $('previewWindowTitle').textContent = firstStepTitle;
    $('previewBtnText').textContent = firstBtnName;

    drawIcon(opProfile.art);

    ['dlZipBtn', 'dlXamlBtn', 'dlIconBtn', 'dlPyBtn'].forEach(id => {
      $(id).disabled = false;
    });
  }

  // Exact Groot-Coloured pyRevit SelectFromList.xaml / ui.xaml template
  function buildGrootSelectFromListXaml(title) {
    const safeTitle = escapeXml(title);
    return `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="${safeTitle}"
        Width="460" Height="500"
        MinWidth="360" MinHeight="340"
        WindowStartupLocation="CenterScreen"
        ResizeMode="CanResizeWithGrip"
        Background="#3B261A"
        Foreground="#F0D2A6"
        FontFamily="Segoe UI"
        PreviewKeyDown="handle_input_key">
    <Window.Resources>
        <Style TargetType="{x:Type TextBlock}">
            <Setter Property="Foreground" Value="#F0D2A6"/>
        </Style>

        <Style TargetType="{x:Type Button}">
            <Setter Property="Background" Value="#6F9E4D"/>
            <Setter Property="Foreground" Value="#140D09"/>
            <Setter Property="BorderBrush" Value="#D2A16B"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Cursor" Value="Hand"/>
        </Style>

        <Style x:Key="ClearButton" TargetType="{x:Type Button}">
            <Setter Property="Background" Value="#24160F"/>
            <Setter Property="Foreground" Value="#D2A16B"/>
            <Setter Property="BorderBrush" Value="#8B5A35"/>
            <Setter Property="BorderThickness" Value="1"/>
        </Style>

        <Style TargetType="{x:Type TextBox}">
            <Setter Property="Background" Value="#24160F"/>
            <Setter Property="Foreground" Value="#F0D2A6"/>
            <Setter Property="CaretBrush" Value="#D2A16B"/>
            <Setter Property="BorderBrush" Value="#8B5A35"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="6,4"/>
        </Style>

        <Style TargetType="{x:Type ListBox}">
            <Setter Property="Background" Value="#24160F"/>
            <Setter Property="Foreground" Value="#F0D2A6"/>
            <Setter Property="BorderBrush" Value="#8B5A35"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="VirtualizingStackPanel.IsVirtualizing" Value="True"/>
            <Setter Property="VirtualizingStackPanel.VirtualizationMode" Value="Recycling"/>
        </Style>

        <Style TargetType="{x:Type CheckBox}">
            <Setter Property="Foreground" Value="#F0D2A6"/>
        </Style>
    </Window.Resources>

    <DockPanel Margin="12" Background="#3B261A">
        <!-- Search & Filter Bar -->
        <DockPanel DockPanel.Dock="Top" Margin="0,0,0,10">
            <ToggleButton x:Name="regexToggle_b" DockPanel.Dock="Left"
                          Width="30" Height="28" Margin="0,0,6,0"
                          Background="#24160F" Foreground="#D2A16B" BorderBrush="#8B5A35"
                          ToolTip="Toggle Regex / Filter Mode" Click="toggle_regex">
                <TextBlock Text="A-Z" FontSize="10" FontWeight="Bold" Foreground="#D2A16B"/>
            </ToggleButton>
            <Grid>
                <TextBox x:Name="search_tb" Height="28" VerticalContentAlignment="Center"/>
                <Button x:Name="clrsearch_b" Visibility="Collapsed"
                        HorizontalAlignment="Right" Width="22" Height="22" Margin="0,0,3,0"
                        Content="x" Style="{StaticResource ClearButton}" Click="clear_search"/>
            </Grid>
        </DockPanel>

        <!-- Group Selector Dock -->
        <DockPanel x:Name="ctx_groups_dock" DockPanel.Dock="Top" Margin="0,0,0,10" Visibility="Collapsed">
            <TextBlock x:Name="ctx_groups_Title_tb" DockPanel.Dock="Left"
                       VerticalAlignment="Center" Margin="0,0,8,0" Foreground="#D2A16B" Text="List Group:"/>
            <ComboBox x:Name="ctx_groups_selector_cb" Height="26" Background="#24160F" Foreground="#F0D2A6" BorderBrush="#8B5A35"/>
        </DockPanel>

        <!-- Bottom Action Buttons -->
        <StackPanel DockPanel.Dock="Bottom" Margin="0,10,0,0">
            <Grid x:Name="checkboxbuttons_g" Margin="0,0,0,8" Visibility="Collapsed">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                <Button x:Name="checkall_b" Grid.Column="0" Height="26" Margin="0,0,4,0"
                        Background="#24160F" Foreground="#D2A16B" BorderBrush="#8B5A35"
                        Content="Check" Click="button_checkall"/>
                <Button x:Name="uncheckall_b" Grid.Column="1" Height="26" Margin="2,0,2,0"
                        Background="#24160F" Foreground="#D2A16B" BorderBrush="#8B5A35"
                        Content="Uncheck" Click="button_uncheckall"/>
                <Button x:Name="toggleall_b" Grid.Column="2" Height="26" Margin="4,0,0,0"
                        Background="#24160F" Foreground="#D2A16B" BorderBrush="#8B5A35"
                        Content="Toggle" Click="button_toggleall"/>
            </Grid>
            <Button x:Name="select_b" Content="Select" Height="32"
                    Background="#6F9E4D" Foreground="#140D09" BorderBrush="#D2A16B"
                    FontWeight="Bold" IsDefault="True" Click="button_select"/>
        </StackPanel>

        <!-- Main ListBox -->
        <ListBox x:Name="list_lb" BorderBrush="#8B5A35" BorderThickness="1" Background="#24160F" Foreground="#F0D2A6">
            <ListBox.Resources>
                <Style TargetType="{x:Type ListBoxItem}">
                    <Setter Property="Foreground" Value="#F0D2A6"/>
                    <Setter Property="Padding" Value="6,4"/>
                </Style>
                <DataTemplate x:Key="DefaultItemTemplate">
                    <StackPanel Orientation="Horizontal">
                        <CheckBox Content="{Binding name}" IsChecked="{Binding state}"
                                  Foreground="#F0D2A6" VerticalAlignment="Center" Click="check_selected"/>
                    </StackPanel>
                </DataTemplate>
            </ListBox.Resources>
        </ListBox>
    </DockPanel>
</Window>`;
  }

  // Non-intrusive Groot Theme Styler: leaves 100% of pyRevit's native SelectFromList / WPFWindow logic intact
  // while painting every window, search bar, list box, button, and alert in Groot colours.
  function buildNonIntrusiveGrootThemeHookPy(cleanedCode, defaultTitle) {
    const lines = cleanedCode.split(/\r?\n/);

    let insertIdx = 0;
    let inDocstring = false;
    let docDelim = '';

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (inDocstring) {
        if (trimmed.includes(docDelim)) inDocstring = false;
        insertIdx = i + 1;
        continue;
      }
      if (i <= 5 && (trimmed.startsWith('"""') || trimmed.startsWith("'''"))) {
        docDelim = trimmed.slice(0, 3);
        if (!trimmed.slice(3).includes(docDelim)) inDocstring = true;
        insertIdx = i + 1;
        continue;
      }
      if (
        trimmed === '' ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('from __future__') ||
        /^__[a-zA-Z0-9_]+__\s*=/.test(trimmed)
      ) {
        insertIdx = i + 1;
      } else {
        break;
      }
    }

    const safeDefaultTitle = defaultTitle.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    const themeHook = `# --- GROOT UI START ---
# Groot Multi-Step Colour Theme Hook (Revit 2025 / 2026 / 2027)
# Keeps 100% of native pyRevit SelectFromList & script logic untouched; skins every step in Groot colours.
import clr as _groot_clr
for _groot_asm in ("PresentationFramework", "PresentationCore", "WindowsBase"):
    try:
        _groot_clr.AddReference(_groot_asm)
    except Exception:
        pass

import System.Windows as _GrootWin
import System.Windows.Controls as _GrootCtrls
import System.Windows.Controls.Primitives as _GrootPrims
import System.Windows.Media as _GrootMedia
import System.Windows.Shapes as _GrootShapes
from pyrevit import forms as _groot_forms

_groot_bc = _GrootMedia.BrushConverter()
_BARK_BG = _groot_bc.ConvertFromString("#3B261A")
_WOOD_BG = _groot_bc.ConvertFromString("#24160F")
_BARK_BORDER = _groot_bc.ConvertFromString("#8B5A35")
_WARM_WOOD = _groot_bc.ConvertFromString("#D2A16B")
_LEAF_GREEN = _groot_bc.ConvertFromString("#6F9E4D")
_CREAM_TEXT = _groot_bc.ConvertFromString("#F0D2A6")
_DARK_TEXT = _groot_bc.ConvertFromString("#140D09")


def _groot_paint_visual_tree(root_obj, depth=0):
    if root_obj is None or depth > 18:
        return
    try:
        if isinstance(root_obj, _GrootWin.Window):
            root_obj.Background = _BARK_BG
            root_obj.Foreground = _CREAM_TEXT
        elif isinstance(root_obj, _GrootCtrls.ListBox):
            root_obj.Background = _WOOD_BG
            root_obj.Foreground = _CREAM_TEXT
            root_obj.BorderBrush = _BARK_BORDER
        elif isinstance(root_obj, _GrootCtrls.TextBox):
            root_obj.Background = _WOOD_BG
            root_obj.Foreground = _CREAM_TEXT
            root_obj.CaretBrush = _WARM_WOOD
            root_obj.BorderBrush = _BARK_BORDER
        elif isinstance(root_obj, _GrootCtrls.ComboBox):
            root_obj.Background = _WOOD_BG
            root_obj.Foreground = _CREAM_TEXT
            root_obj.BorderBrush = _BARK_BORDER
        elif isinstance(root_obj, _GrootCtrls.Button):
            nm = getattr(root_obj, "Name", "") or ""
            is_primary = (nm in ("select_b", "run_btn", "ok_btn")) or bool(getattr(root_obj, "IsDefault", False))
            if is_primary:
                root_obj.Background = _LEAF_GREEN
                root_obj.Foreground = _DARK_TEXT
                root_obj.BorderBrush = _WARM_WOOD
                root_obj.FontWeight = _GrootWin.FontWeights.Bold
            else:
                root_obj.Background = _WOOD_BG
                root_obj.Foreground = _WARM_WOOD
                root_obj.BorderBrush = _BARK_BORDER
        elif isinstance(root_obj, _GrootPrims.ToggleButton) and not isinstance(root_obj, _GrootCtrls.CheckBox):
            root_obj.Background = _WOOD_BG
            root_obj.Foreground = _WARM_WOOD
            root_obj.BorderBrush = _BARK_BORDER
        elif isinstance(root_obj, (_GrootCtrls.CheckBox, _GrootCtrls.RadioButton, _GrootCtrls.Label, _GrootCtrls.ListBoxItem)):
            root_obj.Foreground = _CREAM_TEXT
        elif isinstance(root_obj, _GrootCtrls.TextBlock):
            parent = _GrootMedia.VisualTreeHelper.GetParent(root_obj)
            if not isinstance(parent, (_GrootCtrls.Button, _GrootCtrls.Border)):
                root_obj.Foreground = _CREAM_TEXT
        elif isinstance(root_obj, (_GrootCtrls.DockPanel, _GrootCtrls.Grid, _GrootCtrls.StackPanel)):
            if getattr(root_obj, "Background", None) is not None:
                root_obj.Background = _BARK_BG
        elif isinstance(root_obj, _GrootShapes.Path):
            root_obj.Fill = _WARM_WOOD
    except Exception:
        pass

    try:
        count = _GrootMedia.VisualTreeHelper.GetChildrenCount(root_obj)
        for i in range(count):
            child = _GrootMedia.VisualTreeHelper.GetChild(root_obj, i)
            _groot_paint_visual_tree(child, depth + 1)
    except Exception:
        pass

    try:
        for lchild in _GrootWin.LogicalTreeHelper.GetChildren(root_obj):
            if isinstance(lchild, _GrootWin.DependencyObject):
                _groot_paint_visual_tree(lchild, depth + 1)
    except Exception:
        pass


def _groot_on_window_loaded(sender, e):
    try:
        _groot_paint_visual_tree(sender, 0)
        # Ensure primary button internal template border is Leaf Green in Revit 2025/2026/2027
        for btn_name in ("select_b", "run_btn"):
            btn = getattr(sender, btn_name, None)
            if btn is not None:
                btn.Background = _LEAF_GREEN
                btn.Foreground = _DARK_TEXT
                btn.BorderBrush = _WARM_WOOD
                if _GrootMedia.VisualTreeHelper.GetChildrenCount(btn) > 0:
                    bdr = _GrootMedia.VisualTreeHelper.GetChild(btn, 0)
                    if isinstance(bdr, _GrootCtrls.Border):
                        bdr.Background = _LEAF_GREEN
                        bdr.BorderBrush = _WARM_WOOD
                for tb in _GrootWin.LogicalTreeHelper.GetChildren(btn):
                    if isinstance(tb, _GrootCtrls.TextBlock):
                        tb.Foreground = _DARK_TEXT
    except Exception:
        pass


_orig_wpf_init = _groot_forms.WPFWindow.__init__
def _groot_wpf_init(self, *args, **kwargs):
    _orig_wpf_init(self, *args, **kwargs)
    try:
        _groot_paint_visual_tree(self, 0)
        self.Loaded += _groot_on_window_loaded
        self.ContentRendered += _groot_on_window_loaded
    except Exception:
        pass

_groot_forms.WPFWindow.__init__ = _groot_wpf_init
# --- GROOT UI END ---`;

    const topPart = lines.slice(0, insertIdx).join('\n');
    const bottomPart = lines.slice(insertIdx).join('\n');

    return (topPart ? topPart + '\n\n' : '') + themeHook + '\n\n' + bottomPart + '\n';
  }

  // 96x96 Groot-Coloured Operation Icon Renderer
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function drawIcon(art) {
    const dark = '#3B261A', bark = '#8B5A35', tan = '#D2A16B', green = '#6F9E4D', cream = '#F0D2A6';
    ctx.clearRect(0, 0, 96, 96);

    const bg = ctx.createLinearGradient(4, 4, 91, 93);
    bg.addColorStop(0, '#8B5A35');
    bg.addColorStop(0.42, '#684027');
    bg.addColorStop(1, '#2B1B12');
    rr(2.5, 2.5, 91, 91, 21);
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.strokeStyle = '#D2A16B88';
    ctx.lineWidth = 1.2;
    rr(4, 4, 88, 88, 18);
    ctx.stroke();

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const poly = (pts, fill, stroke = cream, width = 1.5) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
    };
    const strokePath = (pts, color = cream, width = 2.4) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    };
    const rounded = (x, y, w, h, r, fill, stroke = cream, lw = 1.5) => {
      rr(x, y, w, h, r);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
    };
    const curveArrow = (pts, color = green, w = 2.8) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
      ctx.stroke();
      const a = Math.atan2(pts[3][1] - pts[2][1], pts[3][0] - pts[2][0]), l = 6;
      strokePath([[pts[3][0] - l * Math.cos(a - 0.55), pts[3][1] - l * Math.sin(a - 0.55)], [pts[3][0], pts[3][1]], [pts[3][0] - l * Math.cos(a + 0.55), pts[3][1] - l * Math.sin(a + 0.55)]], color, w);
    };
    const isoBlock = (cx, cy, w, h, depth, top = cream, left = bark, right = dark) => {
      poly([[cx - w / 2, cy - h / 4], [cx, cy], [cx, cy + depth], [cx - w / 2, cy - h / 4 + depth]], left, cream, 1.3);
      poly([[cx, cy], [cx + w / 2, cy - h / 4], [cx + w / 2, cy - h / 4 + depth], [cx, cy + depth]], right, cream, 1.3);
      poly([[cx, cy - h / 2], [cx + w / 2, cy - h / 4], [cx, cy], [cx - w / 2, cy - h / 4]], top, cream, 1.4);
    };
    const paper = (x, y, w, h, accented = false) => {
      rounded(x, y, w, h, 3, '#6E452C', cream, 1.3);
      rounded(x + 5, y + 14, w - 10, h - 22, 2, accented ? '#6F9E4D33' : '#3B261A88', accented ? green : tan, 1.3);
    };

    switch (art) {
      case 'view_transfer':
      case 'viewport_place':
      case 'view_duplicate':
        paper(10, 22, 32, 50, false);
        paper(54, 18, 32, 50, true);
        curveArrow([[34, 30], [44, 14], [56, 14], [62, 24]], green, 3);
        break;
      case 'view_template':
        paper(10, 24, 36, 50, false);
        rounded(54, 18, 30, 56, 5, '#4B2D1C', green, 1.5);
        strokePath([[60, 32], [78, 32]], tan, 2);
        strokePath([[60, 45], [78, 45]], green, 2.5);
        strokePath([[60, 58], [78, 58]], tan, 2);
        curveArrow([[42, 48], [48, 36], [52, 36], [56, 42]], green, 2.6);
        break;
      case 'schedule_create':
        isoBlock(24, 44, 24, 24, 20);
        rounded(54, 24, 32, 48, 4, '#4B2E1D', tan, 1.5);
        rounded(58, 29, 24, 8, 1, green, green, 1);
        strokePath([[58, 45], [82, 45]], tan, 1.2);
        strokePath([[58, 55], [82, 55]], tan, 1.2);
        curveArrow([[38, 38], [45, 24], [52, 24], [56, 32]], green, 2.6);
        break;
      case 'stair_path':
        poly([[12,72],[24,72],[24,60],[36,60],[36,48],[48,48],[48,36],[60,36],[60,24],[78,24],[78,34],[66,34],[66,46],[54,46],[54,58],[42,58],[42,70],[30,70],[30,80],[12,80]], bark, tan, 1.2);
        strokePath([[16,68],[28,68],[28,56],[40,56],[40,44],[52,44],[52,32],[72,32]], green, 3.5);
        break;
      case 'tag_create':
        isoBlock(30, 48, 32, 28, 22);
        strokePath([[38, 42], [54, 26], [62, 26]], green, 2.2);
        rounded(60, 16, 26, 20, 3, dark, green, 1.6);
        break;
      default:
        isoBlock(28, 44, 32, 30, 26);
        rounded(54, 18, 32, 58, 5, '#4B2D1C', tan, 1.4);
        rounded(60, 34, 20, 6, 2, green, null, 0);
        rounded(60, 46, 15, 6, 2, bark, null, 0);
        rounded(60, 58, 20, 6, 2, green, null, 0);
        curveArrow([[42, 44], [48, 34], [52, 36], [56, 42]], green, 2.6);
    }
    ctx.restore();
  }

  function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  // Upload events
  $('dropzone').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => processUploadedScript(String(reader.result || ''), file.name);
    reader.readAsText(file);
  });

  ['dragenter', 'dragover'].forEach(ev => $('dropzone').addEventListener(ev, e => {
    e.preventDefault();
    $('dropzone').classList.add('drag');
  }));
  ['dragleave', 'drop'].forEach(ev => $('dropzone').addEventListener(ev, e => {
    e.preventDefault();
    $('dropzone').classList.remove('drag');
  }));
  $('dropzone').addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => processUploadedScript(String(reader.result || ''), file.name);
      reader.readAsText(file);
    }
  });

  // Download Buttons
  $('dlXamlBtn').addEventListener('click', () => downloadFile('ui.xaml', generatedXaml));
  $('dlIconBtn').addEventListener('click', () => {
    canvas.toBlob(blob => downloadFile('icon.png', blob, 'image/png'), 'image/png');
  });
  $('dlPyBtn').addEventListener('click', () => downloadFile('script.py', generatedPy));

  $('dlZipBtn').addEventListener('click', async () => {
    const zip = new JSZip();
    zip.file('ui.xaml', generatedXaml);
    zip.file('SelectFromList.xaml', generatedSelectFromListXaml);
    zip.file('script.py', generatedPy);
    const pngBase64 = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    zip.file('icon.png', pngBase64, { base64: true });
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile('groot_every_step_files.zip', blob, 'application/zip');
  });

  // Download Website Files for GitHub Hosting
  $('dlHtmlBtn').addEventListener('click', () => {
    downloadFile('index.html', '<!doctype html>\n' + document.documentElement.outerHTML, 'text/html');
  });
  $('dlCssBtn').addEventListener('click', async () => {
    try {
      const r = await fetch('style.css');
      if (r.ok) return downloadFile('style.css', await r.text(), 'text/css');
    } catch (e) {}
    let css = '';
    for (const s of document.styleSheets) {
      try { for (const rule of s.cssRules) css += rule.cssText + '\n'; } catch (e) {}
    }
    downloadFile('style.css', css, 'text/css');
  });
  $('dlJsBtn').addEventListener('click', () => {
    downloadFile('app.js', `${initGrootEveryStepStudio.toString()}\ninitGrootEveryStepStudio();\n`, 'text/javascript');
  });

  drawIcon('tag_create');
}
initGrootEveryStepStudio();

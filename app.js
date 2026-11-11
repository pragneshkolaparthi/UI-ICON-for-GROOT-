function initGrootMultiStepStudio() {
  const $ = id => document.getElementById(id);
  const canvas = $('iconCanvas'), ctx = canvas.getContext('2d');

  let generatedPy = '';
  let generatedXaml = '';
  let toolDisplayName = 'Revit Tool';
  let toolSummary = 'Multi-step pyRevit automation tool';

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
    tag_create: { title: 'Tag & Annotation Placement', art: 'tag_create' },
    dimension_create: { title: 'Dimension Automation', art: 'dimension_create' },
    clash_detection: { title: 'Clash Detection', art: 'clash_detection' },
    wall_adjust: { title: 'Element / Wall Adjustment', art: 'wall_adjust' },
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
    if (has(/IndependentTag\.Create|NewTag\s*\(|RoomTag|tag/i)) return 'tag_create';
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

  function humanize(s) {
    return s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
  }

  function escapeXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function processUploadedScript(text, fileName) {
    const cleanedCode = text.replace(/# --- GROOT UI START ---[\s\S]*?# --- GROOT UI END ---\r?\n?/g, '');
    const opKey = detectOperationKey(cleanedCode);
    const opProfile = operationProfiles[opKey] || operationProfiles.parameter_update;

    const titleMatch = cleanedCode.match(/^\s*__title__\s*=\s*["']([^"']+)["']/m);
    const docMatch = cleanedCode.match(/^\s*__doc__\s*=\s*["']([^"']+)["']/m);
    const rawFileName = fileName.replace(/\.py$/i, '');

    toolDisplayName = titleMatch
      ? titleMatch[1].replace(/\\n/g, ' ').trim()
      : (rawFileName.toLowerCase() === 'script' ? opProfile.title : humanize(rawFileName));
    toolSummary = docMatch ? docMatch[1].replace(/\\n/g, ' ').trim() : opProfile.title;

    // Detect top-level constants for Step 1 UI
    const detectedVars = [];
    cleanedCode.split(/\r?\n/).forEach(line => {
      const m = line.match(/^([A-Z][A-Z0-9_]{1,28})\s*=\s*(.+)$/);
      if (m && !m[1].startsWith('__')) {
        const varName = m[1];
        const rhs = m[2].split('#')[0].trim();
        if (/^(True|False)$/.test(rhs)) {
          detectedVars.push({ varName, type: 'CheckBox', label: humanize(varName.toLowerCase()), val: rhs });
        } else if (/^["'][^"']*["']$/.test(rhs)) {
          detectedVars.push({ varName, type: 'TextBox', label: humanize(varName.toLowerCase()), val: rhs.slice(1, -1) });
        } else if (/^\d+(\.\d+)?$/.test(rhs)) {
          detectedVars.push({ varName, type: 'Number', label: humanize(varName.toLowerCase()), val: rhs });
        }
      }
    });

    const listCalls = (cleanedCode.match(/SelectFromList\.show/g) || []).length;
    const inputCalls = (cleanedCode.match(/ask_for_string|ask_for_one_item|CommandSwitchWindow\.show|PickObject/g) || []).length;
    const txCalls = (cleanedCode.match(/Transaction\s*\(/g) || []).length;
    const totalDetectedSteps = 1 + listCalls + inputCalls + txCalls + 1;

    generatedXaml = buildMultiStepGrootXaml(toolDisplayName, toolSummary);
    generatedPy = buildMultiStepScriptPy(cleanedCode, toolDisplayName, toolSummary, detectedVars);

    $('fileNameText').textContent = fileName;
    $('detectedOpText').textContent = opProfile.title;
    $('detectedStepsText').textContent = `${totalDetectedSteps}+ Steps (Start, ${listCalls} List, ${inputCalls} Input/Pick, ${txCalls} Transaction, Summary)`;
    $('previewWindowTitle').textContent = toolDisplayName;
    $('previewBannerText').textContent = `${toolDisplayName.toUpperCase()} (REVIT 2025–2027)`;
    $('previewControlsInfo').textContent =
      `Step 1 + ${listCalls} Selection Step(s) + ${txCalls} Transaction Step(s) + Final Summary (.NET 8 Ready)`;

    drawIcon(opProfile.art);

    ['dlZipBtn', 'dlPyBtn', 'dlXamlBtn', 'dlIconBtn'].forEach(id => {
      $(id).disabled = false;
    });
  }

  // Pure .NET 8 / WPF XAML for Revit 2025, 2026, and 2027 (All events bound in Python to avoid XamlReader issues)
  function buildMultiStepGrootXaml(title, subtitle) {
    const safeTitle = escapeXml(title);
    const safeSub = escapeXml(subtitle);

    return `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="${safeTitle}" Height="480" Width="460"
        WindowStartupLocation="CenterScreen"
        ResizeMode="CanResizeWithGrip"
        MinHeight="370" MinWidth="400"
        Background="#3B261A"
        Foreground="#F0D2A6"
        FontFamily="Segoe UI">

    <Window.Resources>
        <Style x:Key="GrootBtn" TargetType="Button">
            <Setter Property="Background" Value="#6F9E4D"/>
            <Setter Property="Foreground" Value="#140D09"/>
            <Setter Property="BorderBrush" Value="#D2A16B"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Padding" Value="14,7"/>
            <Setter Property="Cursor" Value="Hand"/>
        </Style>
        <Style x:Key="GrootSubBtn" TargetType="Button">
            <Setter Property="Background" Value="#24160F"/>
            <Setter Property="Foreground" Value="#D2A16B"/>
            <Setter Property="BorderBrush" Value="#8B5A35"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="Padding" Value="10,5"/>
            <Setter Property="Cursor" Value="Hand"/>
        </Style>
        <Style TargetType="TextBox">
            <Setter Property="Background" Value="#24160F"/>
            <Setter Property="Foreground" Value="#F0D2A6"/>
            <Setter Property="CaretBrush" Value="#D2A16B"/>
            <Setter Property="BorderBrush" Value="#8B5A35"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="8,6"/>
        </Style>
        <Style TargetType="CheckBox">
            <Setter Property="Foreground" Value="#F0D2A6"/>
            <Setter Property="Margin" Value="0,4,0,4"/>
        </Style>
        <Style TargetType="ListBox">
            <Setter Property="Background" Value="#24160F"/>
            <Setter Property="Foreground" Value="#F0D2A6"/>
            <Setter Property="BorderBrush" Value="#8B5A35"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="6"/>
        </Style>
    </Window.Resources>

    <Grid Margin="18">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <!-- Multi-Step Header Banner + Progress Bar -->
        <Border Grid.Row="0" Background="#24160F" BorderBrush="#6F9E4D" BorderThickness="4,0,0,0" CornerRadius="6" Padding="12,10" Margin="0,0,0,12">
            <StackPanel>
                <DockPanel Margin="0,0,0,4">
                    <Border Background="#6F9E4D" CornerRadius="4" Padding="7,2" DockPanel.Dock="Right">
                        <TextBlock x:Name="step_badge" Text="STEP 1" FontSize="10" FontWeight="Bold" Foreground="#140D09"/>
                    </Border>
                    <TextBlock x:Name="step_title" Text="${safeTitle.toUpperCase()}" FontSize="14" FontWeight="Bold" Foreground="#F0D2A6" TextTrimming="CharacterEllipsis"/>
                </DockPanel>
                <TextBlock x:Name="step_sub" Text="${safeSub}" FontSize="11.5" Foreground="#D2A16B" TextWrapping="Wrap" Margin="0,0,0,8"/>
                <ProgressBar x:Name="step_progress" Height="5" Minimum="0" Maximum="100" Value="20" Background="#3B261A" Foreground="#6F9E4D" BorderBrush="#8B5A35"/>
            </StackPanel>
        </Border>

        <!-- Dynamic Step Body -->
        <Grid Grid.Row="1">
            <!-- MODE 1: LIST SELECTION STEP (SelectFromList) -->
            <Grid x:Name="panel_list" Visibility="Collapsed">
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>
                <TextBox x:Name="search_tb" Grid.Row="0" Margin="0,0,0,8" ToolTip="Search filter"/>
                <ListBox x:Name="items_lb" Grid.Row="1" SelectionMode="Extended"/>
                <StackPanel x:Name="multi_bar" Grid.Row="2" Orientation="Horizontal" Margin="0,8,0,0">
                    <Button x:Name="sel_all_btn" Content="Select All" Style="{StaticResource GrootSubBtn}" Margin="0,0,8,0"/>
                    <Button x:Name="sel_none_btn" Content="Select None" Style="{StaticResource GrootSubBtn}"/>
                </StackPanel>
            </Grid>

            <!-- MODE 2: INPUT / DROPDOWN / SWITCHES STEP -->
            <StackPanel x:Name="panel_input" Visibility="Collapsed" VerticalAlignment="Top">
                <TextBlock x:Name="input_prompt" Text="Enter value:" FontWeight="SemiBold" Margin="0,0,0,6" TextWrapping="Wrap"/>
                <TextBox x:Name="input_tb" Margin="0,0,0,10"/>
                <ComboBox x:Name="input_cb" Visibility="Collapsed" Margin="0,0,0,10" Padding="6,5"/>
                <StackPanel x:Name="switches_sp" Margin="0,4,0,0"/>
            </StackPanel>

            <!-- MODE 3: LAUNCH PARAMETERS / TRANSACTION STEP / FINAL SUMMARY -->
            <ScrollViewer x:Name="panel_message" Visibility="Visible" VerticalScrollBarVisibility="Auto">
                <StackPanel>
                    <Border Background="#24160F" BorderBrush="#8B5A35" BorderThickness="1" CornerRadius="6" Padding="12" Margin="0,0,0,10">
                        <TextBlock x:Name="msg_tb" Text="Ready to begin." Foreground="#F0D2A6" TextWrapping="Wrap" FontSize="12.5"/>
                    </Border>
                    <StackPanel x:Name="params_sp"/>
                </StackPanel>
            </ScrollViewer>
        </Grid>

        <!-- Multi-Step Footer Buttons -->
        <DockPanel Grid.Row="2" Margin="0,14,0,0">
            <TextBlock x:Name="footer_status" Text="Revit 2025 / 2026 / 2027 Groot UI" FontSize="11" Foreground="#D2A16B" VerticalAlignment="Center"/>
            <StackPanel Orientation="Horizontal" HorizontalAlignment="Right" DockPanel.Dock="Right">
                <Button x:Name="no_btn" Content="No" Width="75" Margin="0,0,8,0" Visibility="Collapsed"
                        Style="{StaticResource GrootSubBtn}"/>
                <Button x:Name="cancel_btn" Content="Cancel" Width="85" Margin="0,0,8,0"
                        Style="{StaticResource GrootSubBtn}"/>
                <Button x:Name="run_btn" Content="Next Step ->" MinWidth="125"
                        Style="{StaticResource GrootBtn}"/>
            </StackPanel>
        </DockPanel>
    </Grid>
</Window>`;
  }

  // Builds the Revit 2025/2026/2027 (.NET 8) Multi-Step Groot UI Engine
  function buildMultiStepScriptPy(cleanedCode, title, subtitle, vars) {
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

    const pyTitle = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const pySub = subtitle.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const varsJson = JSON.stringify(vars);

    const engineBlock = `# --- GROOT UI START ---
# Compatible with Revit 2025, Revit 2026, Revit 2027 (.NET 8) & legacy Revit versions
import os as _groot_os
import sys as _groot_sys
import atexit as _groot_atexit
import clr as _groot_clr

for _groot_asm in ("PresentationFramework", "PresentationCore", "WindowsBase", "System"):
    try:
        _groot_clr.AddReference(_groot_asm)
    except Exception:
        pass

import System as _groot_System
from System.Windows import Visibility as _GrootVisibility, Thickness as _GrootThickness
import System.Windows.Controls as _GrootControls
from System.Windows.Media import BrushConverter as _GrootBrushConverter

from pyrevit import forms as _groot_forms
from pyrevit import revit as _groot_revit
import Autodesk.Revit.DB as _groot_DB
import Autodesk.Revit.UI as _groot_UI

# Revit 2025 / 2026 / 2027 64-bit ElementId.Value <-> IntegerValue compatibility shim
try:
    if not hasattr(_groot_DB.ElementId, "IntegerValue"):
        _groot_DB.ElementId.IntegerValue = property(lambda self: int(self.Value))
except Exception:
    pass


def _groot_safe_label(obj, name_attr=None):
    if obj is None:
        return ""
    if isinstance(obj, str):
        return obj
    if name_attr and hasattr(obj, name_attr):
        try:
            val = getattr(obj, name_attr)
            return str(val() if callable(val) else val)
        except Exception:
            pass
    try:
        return str(_groot_revit.query.get_name(obj))
    except Exception:
        pass
    try:
        return str(_groot_DB.Element.Name.__get__(obj))
    except Exception:
        pass
    try:
        if hasattr(obj, "Name") and getattr(obj, "Name", None):
            return str(obj.Name)
    except Exception:
        pass
    return str(obj)


_GROOT_XAML_PATH = _groot_os.path.join(_groot_os.path.dirname(__file__), "ui.xaml")
_GROOT_TOOL_TITLE = "${pyTitle}"
_GROOT_TOOL_SUB = "${pySub}"
_GROOT_STEP_COUNT = [0]
_GROOT_LOGS = []
_GROOT_FINISHED = [False]


class _GrootListItem(object):
    def __init__(self, obj, name_attr=None):
        self.item = obj
        self.label = _groot_safe_label(obj, name_attr)
        self.cb = _GrootControls.CheckBox()
        self.cb.Content = self.label
        self.cb.Foreground = _GrootBrushConverter().ConvertFromString("#F0D2A6")
        self.cb.Margin = _GrootThickness(2, 3, 2, 3)


class _GrootStepWindow(_groot_forms.WPFWindow):
    def __init__(self, mode, title=None, sub=None, button_name="Next Step ->", show_cancel=True, show_no=False):
        try:
            _groot_forms.WPFWindow.__init__(self, _GROOT_XAML_PATH)
        except Exception:
            _groot_forms.WPFWindow.__init__(self, "ui.xaml")

        _GROOT_STEP_COUNT[0] += 1
        self.mode = mode
        self.result_val = None
        self.no_clicked = False
        self._wrapped_items = []
        self._multiselect = False
        self._param_controls = []

        # Programmatic event binding for Revit 2025 / 2026 / 2027 (.NET 8) compatibility
        self.run_btn.Click += self.run_click
        self.cancel_btn.Click += self.cancel_click
        self.no_btn.Click += self.no_click
        self.search_tb.TextChanged += self.search_changed
        self.sel_all_btn.Click += self.select_all_click
        self.sel_none_btn.Click += self.select_none_click

        self.step_badge.Text = "STEP {}".format(_GROOT_STEP_COUNT[0])
        self.step_title.Text = str(title or _GROOT_TOOL_TITLE).upper()
        self.step_sub.Text = str(sub or _GROOT_TOOL_SUB)
        self.step_progress.Value = min(95, _GROOT_STEP_COUNT[0] * 22)
        self.run_btn.Content = str(button_name)
        self.footer_status.Text = "Step {}  |  Revit {}".format(
            _GROOT_STEP_COUNT[0],
            getattr(_groot_revit.HOST_APP, "version", "2025-2027")
        )

        self.cancel_btn.Visibility = _GrootVisibility.Visible if show_cancel else _GrootVisibility.Collapsed
        self.no_btn.Visibility = _GrootVisibility.Visible if show_no else _GrootVisibility.Collapsed
        self.panel_list.Visibility = _GrootVisibility.Visible if mode == "list" else _GrootVisibility.Collapsed
        self.panel_input.Visibility = _GrootVisibility.Visible if mode in ("input", "dropdown", "switches") else _GrootVisibility.Collapsed
        self.panel_message.Visibility = _GrootVisibility.Visible if mode in ("message", "params") else _GrootVisibility.Collapsed

    def setup_params(self, msg_text, param_defs):
        self.msg_tb.Text = str(msg_text)
        brush = _GrootBrushConverter()
        for p in param_defs:
            if p["type"] == "CheckBox":
                cb = _GrootControls.CheckBox()
                cb.Content = p["label"]
                cb.IsChecked = (str(p["val"]).lower() == "true")
                cb.Foreground = brush.ConvertFromString("#F0D2A6")
                cb.Margin = _GrootThickness(0, 4, 0, 6)
                self.params_sp.Children.Add(cb)
                self._param_controls.append((p["varName"], p["type"], cb))
            else:
                lbl = _GrootControls.TextBlock()
                lbl.Text = p["label"]
                lbl.Foreground = brush.ConvertFromString("#D2A16B")
                lbl.Margin = _GrootThickness(0, 4, 0, 2)
                tb = _GrootControls.TextBox()
                tb.Text = str(p["val"])
                tb.Margin = _GrootThickness(0, 0, 0, 8)
                self.params_sp.Children.Add(lbl)
                self.params_sp.Children.Add(tb)
                self._param_controls.append((p["varName"], p["type"], tb))

    def setup_list(self, items, multiselect=False, name_attr=None):
        self._multiselect = bool(multiselect)
        self.multi_bar.Visibility = _GrootVisibility.Visible if self._multiselect else _GrootVisibility.Collapsed
        self._wrapped_items = [_GrootListItem(x, name_attr) for x in (items or [])]
        self._refresh_listbox("")

    def _refresh_listbox(self, query):
        q = (query or "").strip().lower()
        self.items_lb.Items.Clear()
        for w in self._wrapped_items:
            if not q or q in w.label.lower():
                if self._multiselect:
                    self.items_lb.Items.Add(w.cb)
                else:
                    self.items_lb.Items.Add(w.label)
        if not self._multiselect and self.items_lb.Items.Count > 0:
            self.items_lb.SelectedIndex = 0

    def search_changed(self, sender, e):
        q = self.search_tb.Text if hasattr(self, "search_tb") else ""
        self._refresh_listbox(q)

    def select_all_click(self, sender, e):
        for w in self._wrapped_items:
            w.cb.IsChecked = True

    def select_none_click(self, sender, e):
        for w in self._wrapped_items:
            w.cb.IsChecked = False

    def setup_input(self, prompt_text, default_val=""):
        self.input_prompt.Text = str(prompt_text or "Enter value:")
        self.input_tb.Text = str(default_val or "")
        self.input_tb.Visibility = _GrootVisibility.Visible
        self.input_cb.Visibility = _GrootVisibility.Collapsed

    def setup_dropdown(self, prompt_text, items, default_val=None):
        self.input_prompt.Text = str(prompt_text or "Select item:")
        self.input_tb.Visibility = _GrootVisibility.Collapsed
        self.input_cb.Visibility = _GrootVisibility.Visible
        self._wrapped_items = [_GrootListItem(x) for x in (items or [])]
        self.input_cb.Items.Clear()
        sel_idx = 0
        for idx, w in enumerate(self._wrapped_items):
            self.input_cb.Items.Add(w.label)
            if default_val is not None and (w.item == default_val or w.label == str(default_val)):
                sel_idx = idx
        if self._wrapped_items:
            self.input_cb.SelectedIndex = sel_idx

    def setup_switches(self, prompt_text, options):
        self.input_prompt.Text = str(prompt_text or "Choose an option:")
        self.input_tb.Visibility = _GrootVisibility.Collapsed
        self.input_cb.Visibility = _GrootVisibility.Collapsed
        self.run_btn.Visibility = _GrootVisibility.Collapsed
        for opt in (options or []):
            btn = _GrootControls.Button()
            btn.Content = str(opt)
            btn.Style = self.FindResource("GrootBtn")
            btn.Margin = _GrootThickness(0, 4, 0, 4)
            btn.Tag = opt
            btn.Click += self._switch_clicked
            self.switches_sp.Children.Add(btn)

    def _switch_clicked(self, sender, e):
        self.result_val = sender.Tag
        self.DialogResult = True
        self.Close()

    def run_click(self, sender, e):
        if self.mode == "list":
            if self._multiselect:
                self.result_val = [w.item for w in self._wrapped_items if bool(w.cb.IsChecked)]
            else:
                idx = self.items_lb.SelectedIndex
                if idx < 0 and self._wrapped_items:
                    idx = 0
                q = (self.search_tb.Text or "").strip().lower()
                visible = [w for w in self._wrapped_items if not q or q in w.label.lower()]
                self.result_val = visible[idx].item if (0 <= idx < len(visible)) else None
        elif self.mode == "input":
            self.result_val = self.input_tb.Text
        elif self.mode == "dropdown":
            idx = self.input_cb.SelectedIndex
            self.result_val = self._wrapped_items[idx].item if (0 <= idx < len(self._wrapped_items)) else None
        elif self.mode == "params":
            res = {}
            for k, t, ctrl in self._param_controls:
                if t == "CheckBox":
                    res[k] = bool(ctrl.IsChecked)
                elif t == "Number":
                    try:
                        res[k] = float(ctrl.Text.strip())
                    except Exception:
                        res[k] = 0
                else:
                    res[k] = ctrl.Text.strip()
            self.result_val = res
        else:
            self.result_val = True
        self.DialogResult = True
        self.Close()

    def no_click(self, sender, e):
        self.no_clicked = True
        self.result_val = False
        self.DialogResult = False
        self.Close()

    def cancel_click(self, sender, e):
        self.result_val = None
        self.DialogResult = False
        self.Close()


# 1. Replace pyrevit.forms.SelectFromList.show for all selection steps
def _groot_select_from_list(context, title="Select Items", width=None, height=None,
                            button_name="Select & Continue ->", multiselect=False,
                            name_attr=None, **kwargs):
    if isinstance(context, dict):
        flat = []
        for k in context:
            flat.extend(context[k])
        items = flat
    else:
        items = list(context or [])
    win = _GrootStepWindow("list", title=title, sub="Select item(s) for this step", button_name=button_name)
    win.setup_list(items, multiselect=multiselect, name_attr=name_attr)
    if win.show_dialog():
        return win.result_val
    if kwargs.get("exitscript", False):
        _GROOT_FINISHED[0] = True
        _groot_sys.exit()
    return None

_groot_forms.SelectFromList.show = staticmethod(_groot_select_from_list)


# 2. Replace pyrevit.forms.ask_for_string for all text input steps
def _groot_ask_for_string(default=None, prompt="Enter parameter value:", title=None, **kwargs):
    win = _GrootStepWindow("input", title=title or _GROOT_TOOL_TITLE, sub="Input required for this step", button_name="Continue ->")
    win.setup_input(prompt, default)
    if win.show_dialog():
        return win.result_val
    return None

_groot_forms.ask_for_string = _groot_ask_for_string


# 3. Replace pyrevit.forms.ask_for_one_item for dropdown steps
def _groot_ask_for_one_item(items, default=None, prompt="Choose an item:", title=None, **kwargs):
    win = _GrootStepWindow("dropdown", title=title or _GROOT_TOOL_TITLE, sub="Choose option for this step", button_name="Continue ->")
    win.setup_dropdown(prompt, items, default)
    if win.show_dialog():
        return win.result_val
    return None

_groot_forms.ask_for_one_item = _groot_ask_for_one_item


# 4. Replace pyrevit.forms.CommandSwitchWindow.show for command switch steps
def _groot_command_switch(context, message="Select command option:", **kwargs):
    win = _GrootStepWindow("switches", title=_GROOT_TOOL_TITLE, sub="Select an action for this step")
    win.setup_switches(message, context)
    if win.show_dialog():
        return win.result_val
    if kwargs.get("exitscript", False):
        _GROOT_FINISHED[0] = True
        _groot_sys.exit()
    return None

_groot_forms.CommandSwitchWindow.show = staticmethod(_groot_command_switch)


# 5. Replace pyrevit.forms.alert for all intermediate & final alert steps
def _groot_alert(msg, title=None, sub_msg=None, ok=True, cancel=False, yes=False, no=False, exitscript=False, **kwargs):
    full_msg = str(msg) + ("\\n\\n" + str(sub_msg) if sub_msg else "")
    btn_txt = "Yes / Continue ->" if yes else "OK ->"
    win = _GrootStepWindow("message", title=title or _GROOT_TOOL_TITLE,
                           sub="Step Notification", button_name=btn_txt,
                           show_cancel=bool(cancel or exitscript), show_no=bool(no))
    win.setup_params(full_msg, [])
    res = win.show_dialog()
    if exitscript and not res:
        _GROOT_FINISHED[0] = True
        _groot_sys.exit()
    if yes or no:
        return bool(res and not win.no_clicked)
    return bool(res)

_groot_forms.alert = _groot_alert


# 6. Replace Revit TaskDialog.Show so native Revit dialogs also use Groot Step UI
def _groot_taskdialog_show(title, mainInstruction, *args, **kwargs):
    win = _GrootStepWindow("message", title=title or _GROOT_TOOL_TITLE,
                           sub="Revit Step Message", button_name="Continue ->", show_cancel=False)
    win.setup_params(str(mainInstruction), [])
    win.show_dialog()
    return _groot_UI.TaskDialogResult.Ok

try:
    _groot_UI.TaskDialog.Show = staticmethod(_groot_taskdialog_show)
except Exception:
    pass


# 7. Hook pyrevit.revit.Transaction safely (only prompts when model is not already inside an open transaction)
_OrigRevitTx = _groot_revit.Transaction
class _GrootWrappedRevitTx(_OrigRevitTx):
    def __init__(self, name=None, *args, **kwargs):
        tx_name = name or _GROOT_TOOL_TITLE
        doc_obj = getattr(_groot_revit, "doc", None)
        if doc_obj is not None and not getattr(doc_obj, "IsModifiable", False):
            win = _GrootStepWindow("message", title=_GROOT_TOOL_TITLE,
                                   sub="Transaction Step: {}".format(tx_name),
                                   button_name="Execute Step ->", show_cancel=True)
            win.setup_params("Ready to execute Revit model transaction:\\n• {}".format(tx_name), [])
            if not win.show_dialog():
                _GROOT_FINISHED[0] = True
                _groot_sys.exit()
        _GROOT_LOGS.append("Completed Transaction: {}".format(tx_name))
        _OrigRevitTx.__init__(self, name, *args, **kwargs)

_groot_revit.Transaction = _GrootWrappedRevitTx


# 8. Capture print() output across steps and show Final Groot Completion Step
class _GrootStdoutInterceptor(object):
    def __init__(self, orig):
        self._orig = orig
    def write(self, s):
        if s and str(s).strip():
            _GROOT_LOGS.append(str(s).rstrip())
        try:
            self._orig.write(s)
        except Exception:
            pass
    def flush(self):
        try:
            self._orig.flush()
        except Exception:
            pass
    def __getattr__(self, attr):
        return getattr(self._orig, attr)

_groot_sys.stdout = _GrootStdoutInterceptor(_groot_sys.stdout)


def _groot_show_final_summary():
    if _GROOT_FINISHED[0]:
        return
    _GROOT_FINISHED[0] = True
    if _GROOT_LOGS:
        summary_txt = "All script steps completed:\\n\\n" + "\\n".join(_GROOT_LOGS[-18:])
        win = _GrootStepWindow("message", title=_GROOT_TOOL_TITLE,
                               sub="Final Step — Execution Summary",
                               button_name="Finish & Close", show_cancel=False)
        win.step_progress.Value = 100
        win.step_badge.Text = "COMPLETE"
        win.setup_params(summary_txt, [])
        win.show_dialog()


# STEP 1: Initial Launch & Parameter Configuration Window
_groot_init_defs = ${varsJson}
_groot_start_win = _GrootStepWindow(
    "params",
    title=_GROOT_TOOL_TITLE,
    sub=_GROOT_TOOL_SUB,
    button_name="Start Step 1 ->",
    show_cancel=True
)
_groot_start_win.setup_params(
    "Step 1: Review tool settings below and click Start to run each step with the Groot UI.",
    _groot_init_defs
)
if not _groot_start_win.show_dialog():
    _GROOT_FINISHED[0] = True
    _groot_sys.exit()
_groot_atexit.register(_groot_show_final_summary)
# --- GROOT UI END ---`;

    const varOverrides = vars.map(v => {
      return `if "${v.varName}" in (_groot_start_win.result_val or {}):\n    ${v.varName} = _groot_start_win.result_val["${v.varName}"]`;
    }).join('\n');

    const topPart = lines.slice(0, insertIdx).join('\n');
    const bottomPart = lines.slice(insertIdx).join('\n');

    let finalPy = (topPart ? topPart + '\n\n' : '') + engineBlock + '\n\n' + bottomPart;
    if (varOverrides) {
      finalPy += '\n\n# Apply Step 1 Groot UI parameter values\n' + varOverrides + '\n';
    }
    finalPy += '\n_groot_show_final_summary()\n';
    return finalPy;
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

  // Download Tool Files
  $('dlPyBtn').addEventListener('click', () => downloadFile('script.py', generatedPy));
  $('dlXamlBtn').addEventListener('click', () => downloadFile('ui.xaml', generatedXaml));
  $('dlIconBtn').addEventListener('click', () => {
    canvas.toBlob(blob => downloadFile('icon.png', blob, 'image/png'), 'image/png');
  });

  $('dlZipBtn').addEventListener('click', async () => {
    const zip = new JSZip();
    zip.file('script.py', generatedPy);
    zip.file('ui.xaml', generatedXaml);
    const pngBase64 = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    zip.file('icon.png', pngBase64, { base64: true });
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile('groot_revit_2025_2026_2027_files.zip', blob, 'application/zip');
  });

  // Download Website Files for GitHub
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
    downloadFile('app.js', `${initGrootMultiStepStudio.toString()}\ninitGrootMultiStepStudio();\n`, 'text/javascript');
  });

  drawIcon('view_transfer');
}
initGrootMultiStepStudio();

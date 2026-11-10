function initGrootGenerator() {
  const $ = id => document.getElementById(id);
  const canvas = $('iconCanvas'), ctx = canvas.getContext('2d');

  let uploadedScript = '';
  let generatedPy = '';
  let generatedXaml = '';
  let toolDisplayName = 'Revit Tool';
  let toolSummary = 'Select options and click Run to execute.';
  let detectedArt = 'parameter_update';

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
    uploadedScript = text;
    const opKey = detectOperationKey(text);
    const opProfile = operationProfiles[opKey] || operationProfiles.parameter_update;
    detectedArt = opProfile.art;

    // Read existing __title__ or fallback to file name for UI header ONLY (never overwrite __title__ in script.py!)
    const titleMatch = text.match(/^\s*__title__\s*=\s*["']([^"']+)["']/m);
    const docMatch = text.match(/^\s*__doc__\s*=\s*["']([^"']+)["']/m);
    const rawFileName = fileName.replace(/\.py$/i, '');
    toolDisplayName = titleMatch
      ? titleMatch[1].replace(/\\n/g, ' ').trim()
      : (rawFileName.toLowerCase() === 'script' ? opProfile.title : humanize(rawFileName));
    toolSummary = docMatch ? docMatch[1].replace(/\\n/g, ' ').trim() : opProfile.title;

    // Extract simple top-level configuration constants (strings, numbers, booleans)
    const detectedVars = [];
    const lines = text.split(/\r?\n/);
    lines.forEach(line => {
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

    generatedXaml = buildGrootXaml(toolDisplayName, toolSummary, detectedVars);
    generatedPy = buildSafeScriptPy(text, detectedVars);

    // Update UI status
    $('fileNameText').textContent = fileName;
    $('detectedOpText').textContent = opProfile.title;
    $('detectedInputsText').textContent = detectedVars.length
      ? `${detectedVars.length} parameter(s) wired to UI`
      : 'Groot Run/Cancel launcher wired';
    $('previewWindowTitle').textContent = toolDisplayName;
    $('previewBannerText').textContent = toolDisplayName.toUpperCase();
    $('previewControlsInfo').textContent = detectedVars.length
      ? `Controls: ${detectedVars.map(v => v.varName).join(', ')}`
      : 'Keeps original pushbutton name & Revit transactions intact';

    drawIcon(detectedArt);

    ['dlZipBtn', 'dlPyBtn', 'dlXamlBtn', 'dlIconBtn'].forEach(id => {
      $(id).disabled = false;
    });
  }

  function buildGrootXaml(title, subtitle, vars) {
    const safeTitle = escapeXml(title);
    const safeSub = escapeXml(subtitle);
    const height = Math.max(260, 210 + vars.length * 54);

    const controlsMarkup = vars.length > 0
      ? vars.map((v, i) => {
          if (v.type === 'CheckBox') {
            return `            <CheckBox x:Name="ctrl_${i}" Content="${escapeXml(v.label)}" IsChecked="${v.val}" Margin="0,6,0,8"/>`;
          }
          return `            <TextBlock Text="${escapeXml(v.label)}" FontWeight="SemiBold" Margin="0,0,0,4"/>
            <TextBox x:Name="ctrl_${i}" Text="${escapeXml(v.val)}" Margin="0,0,0,12"/>`;
        }).join('\n')
      : `            <Border Background="#24160F" BorderBrush="#8B5A35" BorderThickness="1" CornerRadius="6" Padding="12" Margin="0,4,0,8">
                <TextBlock Text="Click Run to execute this tool in the active Revit model, or Cancel to exit safely." Foreground="#F0D2A6" TextWrapping="Wrap" FontSize="12"/>
            </Border>`;

    return `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="${safeTitle}" Height="${height}" Width="420"
        WindowStartupLocation="CenterScreen"
        ResizeMode="NoResize"
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
        <Style TargetType="TextBox">
            <Setter Property="Background" Value="#24160F"/>
            <Setter Property="Foreground" Value="#F0D2A6"/>
            <Setter Property="CaretBrush" Value="#D2A16B"/>
            <Setter Property="BorderBrush" Value="#8B5A35"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="8,5"/>
        </Style>
        <Style TargetType="CheckBox">
            <Setter Property="Foreground" Value="#F0D2A6"/>
        </Style>
    </Window.Resources>

    <Grid Margin="18">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <Border Grid.Row="0" Background="#24160F" BorderBrush="#6F9E4D" BorderThickness="4,0,0,0" CornerRadius="6" Padding="12,10" Margin="0,0,0,14">
            <StackPanel>
                <TextBlock Text="${safeTitle.toUpperCase()}" FontSize="14" FontWeight="Bold" Foreground="#F0D2A6"/>
                <TextBlock Text="${safeSub}" FontSize="11" Foreground="#D2A16B" Margin="0,2,0,0" TextWrapping="Wrap"/>
            </StackPanel>
        </Border>

        <StackPanel Grid.Row="1">
${controlsMarkup}
        </StackPanel>

        <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Right" Margin="0,14,0,0">
            <Button Content="Cancel" Width="90" Margin="0,0,10,0"
                    Background="#24160F" Foreground="#D2A16B" BorderBrush="#8B5A35"
                    Style="{StaticResource GrootBtn}" Click="cancel_click"/>
            <Button Content="Run" Width="120"
                    Style="{StaticResource GrootBtn}" Click="run_click"/>
        </StackPanel>
    </Grid>
</Window>`;
  }

  // Safely injects the Groot UI dialog WITHOUT overwriting __title__ or indenting the user's code
  function buildSafeScriptPy(originalCode, vars) {
    // If the script already has our Groot launcher, strip the old block first
    const cleanedCode = originalCode.replace(/# --- GROOT UI START ---[\s\S]*?# --- GROOT UI END ---\r?\n?/g, '');
    const lines = cleanedCode.split(/\r?\n/);

    // Find safe insertion line: after encoding, docstring, __future__ imports, and __title__/__doc__ metadata
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
        const rest = trimmed.slice(3);
        if (!rest.includes(docDelim)) {
          inDocstring = true;
        }
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

    const varOverrides = vars.map((v, i) => {
      if (v.type === 'CheckBox') return `${v.varName} = bool(_groot_win.ctrl_${i}.IsChecked)`;
      if (v.type === 'Number') return `try:\n    ${v.varName} = float(_groot_win.ctrl_${i}.Text.strip())\nexcept:\n    pass`;
      return `${v.varName} = _groot_win.ctrl_${i}.Text.strip()`;
    }).join('\n');

    const grootBlock = [
      '# --- GROOT UI START ---',
      'import sys as _groot_sys',
      'from pyrevit import forms as _groot_forms',
      '',
      'class _GrootUIWindow(_groot_forms.WPFWindow):',
      '    def __init__(self):',
      '        _groot_forms.WPFWindow.__init__(self, "ui.xaml")',
      '    def run_click(self, sender, e):',
      '        self.DialogResult = True',
      '        self.Close()',
      '    def cancel_click(self, sender, e):',
      '        self.DialogResult = False',
      '        self.Close()',
      '',
      '_groot_win = _GrootUIWindow()',
      'if not _groot_win.show_dialog():',
      '    _groot_sys.exit()',
      '# --- GROOT UI END ---'
    ].join('\n');

    const topPart = lines.slice(0, insertIdx).join('\n');
    const bottomPart = lines.slice(insertIdx).join('\n');

    let finalPy = (topPart ? topPart + '\n\n' : '') + grootBlock + '\n\n' + bottomPart;
    if (varOverrides) {
      finalPy += '\n# Override detected constants from Groot UI\n' + varOverrides + '\n';
    }
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
    downloadFile('groot_pushbutton_files.zip', blob, 'application/zip');
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
    downloadFile('app.js', `${initGrootGenerator.toString()}\ninitGrootGenerator();\n`, 'text/javascript');
  });

  drawIcon('view_transfer');
}
initGrootGenerator();

function initGrootUIOnlyStudio() {
  const $ = id => document.getElementById(id);
  const canvas = $('iconCanvas'), ctx = canvas.getContext('2d');

  let generatedXaml = '';
  let toolDisplayName = 'Revit Tool';
  let previewStepIndex = 0;
  let currentSteps = [
    { title: 'STEP 1: SELECT & READ INPUTS', desc: 'Collects target views, sheets, or model elements from the active Revit document.' },
    { title: 'STEP 2: CONFIGURE & VALIDATE', desc: 'Applies Groot tool rules, filters, and template/parameter mappings.' },
    { title: 'STEP 3: READY TO EXECUTE', desc: 'All checks passed. Click Run Tool to execute your script in Revit.' }
  ];

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
    view_transfer: {
      title: 'Transfer Views Between Sheets',
      art: 'view_transfer',
      steps: [
        { title: 'STEP 1: READ SOURCE SHEET & VIEWS', desc: 'Reads source sheet viewports and collects target destination sheets.' },
        { title: 'STEP 2: ALIGN VIEWPORT & TEMPLATE', desc: 'Matches viewport placement coordinates and view template assignments.' },
        { title: 'STEP 3: COMPLETE SHEET TRANSFER', desc: 'Ready to transfer views. Click Run Tool to execute in Revit.' }
      ]
    },
    viewport_place: {
      title: 'Place Views on Sheets',
      art: 'viewport_place',
      steps: [
        { title: 'STEP 1: SELECT MODEL VIEWS', desc: 'Collects selected plan, section, or elevation views from the browser.' },
        { title: 'STEP 2: TARGET SHEET POSITIONING', desc: 'Calculates viewport center points on the destination drawing sheets.' },
        { title: 'STEP 3: PLACE VIEWPORTS', desc: 'Ready to create viewports. Click Run Tool to execute in Revit.' }
      ]
    },
    view_duplicate: {
      title: 'Duplicate Revit Views',
      art: 'view_duplicate',
      steps: [
        { title: 'STEP 1: COLLECT SOURCE VIEWS', desc: 'Identifies source views selected for duplication.' },
        { title: 'STEP 2: DUPLICATION OPTIONS', desc: 'Applies duplicate with detailing / dependent view settings and naming.' },
        { title: 'STEP 3: CREATE DUPLICATE VIEWS', desc: 'Ready to generate views. Click Run Tool to execute in Revit.' }
      ]
    },
    view_template: {
      title: 'Copy / Apply View Templates',
      art: 'view_template',
      steps: [
        { title: 'STEP 1: SELECT SOURCE TEMPLATES', desc: 'Reads view templates from the active or linked Revit document.' },
        { title: 'STEP 2: MAP TARGET VIEWS', desc: 'Matches category overrides, filters, and view template parameters.' },
        { title: 'STEP 3: APPLY VIEW TEMPLATES', desc: 'Ready to apply view templates. Click Run Tool to execute in Revit.' }
      ]
    },
    schedule_create: {
      title: 'Unified Schedule Export / Creation',
      art: 'schedule_create',
      steps: [
        { title: 'STEP 1: COLLECT SCHEDULES & LINKS', desc: 'Scans active model and linked files for schedule data and fields.' },
        { title: 'STEP 2: FORMAT TABULAR DATA', desc: 'Organizes rows, headers, and export file path settings.' },
        { title: 'STEP 3: EXPORT / UPDATE SCHEDULES', desc: 'Ready to process schedules. Click Run Tool to execute in Revit.' }
      ]
    },
    sheet_create: {
      title: 'Drawing Sheet Automation',
      art: 'sheet_create',
      steps: [
        { title: 'STEP 1: SELECT TITLEBLOCK & LIST', desc: 'Reads titleblock families and sheet numbering sequence.' },
        { title: 'STEP 2: ASSIGN SHEET PARAMETERS', desc: 'Populates sheet names, numbers, and revision metadata.' },
        { title: 'STEP 3: GENERATE SHEETS', desc: 'Ready to create drawing sheets. Click Run Tool to execute in Revit.' }
      ]
    },
    stair_path: {
      title: 'Stair Path Automation',
      art: 'stair_path',
      steps: [
        { title: 'STEP 1: COLLECT STAIR ELEMENTS', desc: 'Finds stairs and risers in the active plan view.' },
        { title: 'STEP 2: COMPUTE UP/DOWN ROUTE', desc: 'Calculates stair path direction lines and annotation graphics.' },
        { title: 'STEP 3: PLACE STAIR PATHS', desc: 'Ready to draw stair paths. Click Run Tool to execute in Revit.' }
      ]
    },
    tag_create: {
      title: 'Place Tags & Annotations',
      art: 'tag_create',
      steps: [
        { title: 'STEP 1: SCAN ROOMS & ELEMENTS', desc: 'Finds untagged rooms, doors, or elements in the active view.' },
        { title: 'STEP 2: ALIGN TAG LOCATIONS', desc: 'Calculates tag leader points and avoids annotation overlaps.' },
        { title: 'STEP 3: PLACE REVIT TAGS', desc: 'Ready to place tags. Click Run Tool to execute in Revit.' }
      ]
    },
    dimension_create: {
      title: 'Dimension Automation',
      art: 'dimension_create',
      steps: [
        { title: 'STEP 1: PICK GEOMETRY REFERENCES', desc: 'Reads grid, wall, or element reference planes for dimensioning.' },
        { title: 'STEP 2: OFFSET & DIMENSION STYLE', desc: 'Aligns dimension string offsets and linear style settings.' },
        { title: 'STEP 3: CREATE DIMENSIONS', desc: 'Ready to place dimensions. Click Run Tool to execute in Revit.' }
      ]
    },
    clash_detection: {
      title: 'Clash & Coordination Check',
      art: 'clash_detection',
      steps: [
        { title: 'STEP 1: COLLECT MODEL SOLIDS', desc: 'Gathers structural, architectural, and MEP elements for checking.' },
        { title: 'STEP 2: INTERSECTION ANALYSIS', desc: 'Tests 3D bounding boxes and solid geometry overlaps.' },
        { title: 'STEP 3: HIGHLIGHT CLASHES', desc: 'Ready to report clashes. Click Run Tool to execute in Revit.' }
      ]
    },
    wall_adjust: {
      title: 'Element & Section Toggle / Adjust',
      art: 'wall_adjust',
      steps: [
        { title: 'STEP 1: IDENTIFY TARGET ELEMENTS', desc: 'Reads selected walls, section boxes, or building elements.' },
        { title: 'STEP 2: COMPUTE ALIGNMENT STATE', desc: 'Prepares visibility, crop region, or location adjustments.' },
        { title: 'STEP 3: UPDATE ACTIVE VIEW / MODEL', desc: 'Ready to apply changes. Click Run Tool to execute in Revit.' }
      ]
    },
    element_move: {
      title: 'Move / Copy Elements',
      art: 'element_move',
      steps: [
        { title: 'STEP 1: SELECT SOURCE ELEMENTS', desc: 'Reads elements selected in the active Revit model.' },
        { title: 'STEP 2: TRANSFORM VECTOR SETUP', desc: 'Calculates translation coordinates and copy options.' },
        { title: 'STEP 3: EXECUTE TRANSFORM', desc: 'Ready to transform elements. Click Run Tool to execute in Revit.' }
      ]
    },
    family_instance: {
      title: 'Family Placement & Management',
      art: 'family_instance',
      steps: [
        { title: 'STEP 1: LOCATE FAMILY SYMBOL', desc: 'Finds target family types and host placement references.' },
        { title: 'STEP 2: MAP INSTANCE PARAMETERS', desc: 'Sets level, offset, and instance parameter values.' },
        { title: 'STEP 3: PLACE FAMILY INSTANCES', desc: 'Ready to place families. Click Run Tool to execute in Revit.' }
      ]
    },
    export_file: {
      title: 'Export Revit Data',
      art: 'export_file',
      steps: [
        { title: 'STEP 1: COLLECT EXPORT SET', desc: 'Gathers views, schedules, or sheets queued for export.' },
        { title: 'STEP 2: FORMAT OUTPUT OPTIONS', desc: 'Configures naming rules and target export structure.' },
        { title: 'STEP 3: RUN EXPORT', desc: 'Ready to export files. Click Run Tool to execute in Revit.' }
      ]
    },
    import_file: {
      title: 'Import External Data',
      art: 'import_file',
      steps: [
        { title: 'STEP 1: READ EXTERNAL SOURCE', desc: 'Parses incoming spreadsheet or external link data.' },
        { title: 'STEP 2: MAP TO REVIT PARAMETERS', desc: 'Matches external keys to Revit element IDs and parameters.' },
        { title: 'STEP 3: APPLY IMPORT', desc: 'Ready to update data. Click Run Tool to execute in Revit.' }
      ]
    },
    level_create: {
      title: 'Level & Datum Automation',
      art: 'level_create',
      steps: [
        { title: 'STEP 1: READ DATUM ELEVATIONS', desc: 'Collects existing levels and grid datum references.' },
        { title: 'STEP 2: CONFIGURE ELEVATION OFFSETS', desc: 'Validates datum names and elevation spacings.' },
        { title: 'STEP 3: UPDATE LEVELS', desc: 'Ready to update datums. Click Run Tool to execute in Revit.' }
      ]
    },
    parameter_update: {
      title: 'Revit Element Automation',
      art: 'parameter_update',
      steps: [
        { title: 'STEP 1: COLLECT TARGET ELEMENTS', desc: 'Selects and filters target elements in the active Revit document.' },
        { title: 'STEP 2: CONFIGURE PARAMETERS', desc: 'Prepares parameter values and validates model state.' },
        { title: 'STEP 3: EXECUTE IN REVIT', desc: 'Ready to run automation. Click Run Tool to execute in Revit.' }
      ]
    }
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

  function extractScriptConstants(text) {
    const vars = [];
    text.split(/\r?\n/).forEach(line => {
      const m = line.match(/^([A-Z][A-Z0-9_]{1,28})\s*=\s*(.+)$/);
      if (m && !m[1].startsWith('__')) {
        const varName = m[1];
        const rhs = m[2].split('#')[0].trim();
        if (/^(True|False)$/.test(rhs)) {
          vars.push({ name: varName.toLowerCase() + '_cb', type: 'CheckBox', label: humanize(varName.toLowerCase()), val: rhs });
        } else if (/^["'][^"']*["']$/.test(rhs)) {
          vars.push({ name: varName.toLowerCase() + '_tb', type: 'TextBox', label: humanize(varName.toLowerCase()), val: rhs.slice(1, -1) });
        } else if (/^\d+(\.\d+)?$/.test(rhs)) {
          vars.push({ name: varName.toLowerCase() + '_tb', type: 'TextBox', label: humanize(varName.toLowerCase()), val: rhs });
        }
      }
    });
    return vars;
  }

  function processUploadedScript(text, fileName) {
    const opKey = detectOperationKey(text);
    const opProfile = operationProfiles[opKey] || operationProfiles.parameter_update;

    const titleMatch = text.match(/^\s*__title__\s*=\s*["']([^"']+)["']/m);
    const docMatch = text.match(/^\s*__doc__\s*=\s*["']([^"']+)["']/m);
    const rawFileName = fileName.replace(/\.py$/i, '');

    toolDisplayName = titleMatch
      ? titleMatch[1].replace(/\\n/g, ' ').trim()
      : (rawFileName.toLowerCase() === 'script' ? opProfile.title : humanize(rawFileName));
    const toolSummary = docMatch ? docMatch[1].replace(/\\n/g, ' ').trim() : opProfile.title;

    currentSteps = opProfile.steps.map(s => ({ ...s }));
    const detectedVars = extractScriptConstants(text);

    generatedXaml = buildPureXamlMultiStepWizard(toolDisplayName, toolSummary, currentSteps, detectedVars);

    $('fileNameText').textContent = fileName;
    $('detectedOpText').textContent = opProfile.title;
    $('detectedStepsText').textContent = currentSteps.map((s, i) => `Step ${i + 1}`).join(' → ') + ' → Run';
    $('previewWindowTitle').textContent = toolDisplayName;

    previewStepIndex = 0;
    updateInteractivePreview();
    drawIcon(opProfile.art);

    ['dlZipBtn', 'dlXamlBtn', 'dlIconBtn'].forEach(id => {
      $(id).disabled = false;
    });
  }

  function updateInteractivePreview() {
    const total = currentSteps.length;
    const stepObj = currentSteps[previewStepIndex] || currentSteps[0];
    const pct = Math.round(((previewStepIndex + 1) / total) * 100);

    $('previewStepBadge').textContent = `STEP ${previewStepIndex + 1} OF ${total}`;
    $('previewBannerText').textContent = stepObj.title;
    $('previewProgressBar').style.width = `${pct}%`;
    $('previewStepBody').textContent = stepObj.desc;

    $('previewBackBtn').style.display = previewStepIndex > 0 ? 'inline-block' : 'none';
    $('previewNextBtn').textContent = previewStepIndex < total - 1 ? 'Next Step →' : 'Run Tool ✓';
  }

  $('previewNextBtn').addEventListener('click', () => {
    if (previewStepIndex < currentSteps.length - 1) {
      previewStepIndex++;
    } else {
      previewStepIndex = 0;
    }
    updateInteractivePreview();
  });

  $('previewBackBtn').addEventListener('click', () => {
    if (previewStepIndex > 0) {
      previewStepIndex--;
      updateInteractivePreview();
    }
  });

  // Builds a 100% Pure-XAML Multi-Step Wizard (Steps advance via native WPF RadioButton + DataTrigger with zero Python lag)
  function buildPureXamlMultiStepWizard(title, subtitle, steps, vars) {
    const safeTitle = escapeXml(title);
    const safeSub = escapeXml(subtitle);
    const s1 = steps[0] || { title: 'STEP 1: INPUT & SELECTION', desc: 'Select target elements.' };
    const s2 = steps[1] || { title: 'STEP 2: CONFIGURE OPTIONS', desc: 'Review settings.' };
    const s3 = steps[2] || { title: 'STEP 3: READY TO EXECUTE', desc: 'Click Run Tool to execute.' };

    const extraControlsXaml = vars.length > 0
      ? vars.map(v => {
          if (v.type === 'CheckBox') {
            return `                        <CheckBox x:Name="${escapeXml(v.name)}" Content="${escapeXml(v.label)}" IsChecked="${v.val}" Margin="0,4,0,6"/>`;
          }
          return `                        <TextBlock Text="${escapeXml(v.label)}" FontWeight="SemiBold" Foreground="#D2A16B" Margin="0,4,0,2"/>
                        <TextBox x:Name="${escapeXml(v.name)}" Text="${escapeXml(v.val)}" Margin="0,0,0,8"/>`;
        }).join('\n')
      : `                        <CheckBox x:Name="purge_cb" Content="Validate active Revit view &amp; selection state" IsChecked="True" Margin="0,4,0,4"/>
                        <CheckBox x:Name="workset_cb" Content="Preserve existing element &amp; sheet associations" IsChecked="True" Margin="0,4,0,4"/>`;

    return `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="${safeTitle}" Height="460" Width="460"
        WindowStartupLocation="CenterScreen"
        ResizeMode="CanResizeWithGrip"
        MinHeight="360" MinWidth="400"
        Background="#3B261A"
        Foreground="#F0D2A6"
        FontFamily="Segoe UI">

    <Window.Resources>
        <!-- Primary Groot Action Button -->
        <Style x:Key="GrootBtn" TargetType="Button">
            <Setter Property="Background" Value="#6F9E4D"/>
            <Setter Property="Foreground" Value="#140D09"/>
            <Setter Property="BorderBrush" Value="#D2A16B"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Padding" Value="14,7"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}"
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="5"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>

        <!-- Secondary Bark Button -->
        <Style x:Key="GrootSubBtn" TargetType="Button" BasedOn="{StaticResource GrootBtn}">
            <Setter Property="Background" Value="#24160F"/>
            <Setter Property="Foreground" Value="#D2A16B"/>
            <Setter Property="BorderBrush" Value="#8B5A35"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="Padding" Value="10,5"/>
        </Style>

        <!-- Pure-XAML Step Wizard RadioButton Styled as a Button -->
        <Style x:Key="GrootWizardRadioBtn" TargetType="RadioButton">
            <Setter Property="Background" Value="#6F9E4D"/>
            <Setter Property="Foreground" Value="#140D09"/>
            <Setter Property="BorderBrush" Value="#D2A16B"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Padding" Value="14,7"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="RadioButton">
                        <Border Background="{TemplateBinding Background}"
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="5"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
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
            <Setter Property="Padding" Value="4"/>
            <Setter Property="VirtualizingStackPanel.IsVirtualizing" Value="True"/>
            <Setter Property="VirtualizingStackPanel.VirtualizationMode" Value="Recycling"/>
        </Style>
    </Window.Resources>

    <Grid Margin="16">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <!-- Multi-Step Header Banner + Live Step Progress -->
        <Border Grid.Row="0" Background="#24160F" BorderBrush="#6F9E4D" BorderThickness="4,0,0,0" CornerRadius="6" Padding="12,10" Margin="0,0,0,12">
            <StackPanel>
                <DockPanel Margin="0,0,0,4">
                    <Border Background="#6F9E4D" CornerRadius="4" Padding="7,2" DockPanel.Dock="Right">
                        <TextBlock x:Name="step_badge" FontSize="10" FontWeight="Bold" Foreground="#140D09">
                            <TextBlock.Style>
                                <Style TargetType="TextBlock">
                                    <Setter Property="Text" Value="STEP 1 OF 3"/>
                                    <Style.Triggers>
                                        <DataTrigger Binding="{Binding ElementName=step2_state, Path=IsChecked}" Value="True">
                                            <Setter Property="Text" Value="STEP 2 OF 3"/>
                                        </DataTrigger>
                                        <DataTrigger Binding="{Binding ElementName=step3_state, Path=IsChecked}" Value="True">
                                            <Setter Property="Text" Value="STEP 3 OF 3"/>
                                        </DataTrigger>
                                    </Style.Triggers>
                                </Style>
                            </TextBlock.Style>
                        </TextBlock>
                    </Border>
                    <TextBlock x:Name="step_title" Text="${safeTitle.toUpperCase()}" FontSize="14" FontWeight="Bold" Foreground="#F0D2A6" TextTrimming="CharacterEllipsis"/>
                </DockPanel>
                <TextBlock x:Name="step_sub" Text="${safeSub}" FontSize="11.5" Foreground="#D2A16B" TextWrapping="Wrap" Margin="0,0,0,8"/>
                <ProgressBar x:Name="step_progress" Height="5" Minimum="0" Maximum="100" Background="#3B261A" Foreground="#6F9E4D" BorderBrush="#8B5A35">
                    <ProgressBar.Style>
                        <Style TargetType="ProgressBar">
                            <Setter Property="Value" Value="33"/>
                            <Style.Triggers>
                                <DataTrigger Binding="{Binding ElementName=step2_state, Path=IsChecked}" Value="True">
                                    <Setter Property="Value" Value="66"/>
                                </DataTrigger>
                                <DataTrigger Binding="{Binding ElementName=step3_state, Path=IsChecked}" Value="True">
                                    <Setter Property="Value" Value="100"/>
                                </DataTrigger>
                            </Style.Triggers>
                        </Style>
                    </ProgressBar.Style>
                </ProgressBar>
            </StackPanel>
        </Border>

        <!-- Dynamic Step Body -->
        <Grid Grid.Row="1">
            <!-- Optional List Mode Panel (kept for compatibility with list scripts) -->
            <Grid x:Name="panel_list" Visibility="Collapsed">
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>
                <TextBox x:Name="search_tb" Grid.Row="0" Margin="0,0,0,8"/>
                <ListBox x:Name="items_lb" Grid.Row="1" SelectionMode="Extended"/>
                <StackPanel x:Name="multi_bar" Grid.Row="2" Orientation="Horizontal" Margin="0,8,0,0">
                    <Button x:Name="sel_all_btn" Content="Select All" Style="{StaticResource GrootSubBtn}" Margin="0,0,8,0"/>
                    <Button x:Name="sel_none_btn" Content="Select None" Style="{StaticResource GrootSubBtn}"/>
                </StackPanel>
            </Grid>

            <!-- Optional Input Mode Panel (kept for compatibility) -->
            <StackPanel x:Name="panel_input" Visibility="Collapsed" VerticalAlignment="Top">
                <TextBlock x:Name="input_prompt" Text="Enter value:" FontWeight="SemiBold" Margin="0,0,0,6" TextWrapping="Wrap"/>
                <TextBox x:Name="input_tb" Margin="0,0,0,10"/>
                <ComboBox x:Name="input_cb" Visibility="Collapsed" Margin="0,0,0,10" Padding="6,5"/>
                <StackPanel x:Name="switches_sp" Margin="0,4,0,0"/>
                <ListBox x:Name="switches_lb" Visibility="Collapsed" Height="180"/>
            </StackPanel>

            <!-- Multi-Step Wizard Panels (Works automatically via pure XAML triggers) -->
            <ScrollViewer x:Name="panel_message" Visibility="Visible" VerticalScrollBarVisibility="Auto">
                <StackPanel>
                    <!-- STEP 1 PANEL -->
                    <Border Background="#24160F" BorderBrush="#8B5A35" BorderThickness="1" CornerRadius="6" Padding="14">
                        <Border.Style>
                            <Style TargetType="Border">
                                <Setter Property="Visibility" Value="Collapsed"/>
                                <Style.Triggers>
                                    <DataTrigger Binding="{Binding ElementName=step1_state, Path=IsChecked}" Value="True">
                                        <Setter Property="Visibility" Value="Visible"/>
                                    </DataTrigger>
                                </Style.Triggers>
                            </Style>
                        </Border.Style>
                        <StackPanel>
                            <TextBlock Text="${escapeXml(s1.title)}" FontWeight="Bold" FontSize="12.5" Foreground="#6F9E4D" Margin="0,0,0,6"/>
                            <TextBlock x:Name="msg_tb" Text="${escapeXml(s1.desc)}" Foreground="#F0D2A6" TextWrapping="Wrap" FontSize="12" Margin="0,0,0,10"/>
                            <TextBlock Text="Filter / Prefix (Optional):" FontSize="11" Foreground="#D2A16B" Margin="0,0,0,4"/>
                            <TextBox x:Name="prefix_tb" Text=""/>
                            <StackPanel x:Name="params_sp" Margin="0,6,0,0"/>
                        </StackPanel>
                    </Border>

                    <!-- STEP 2 PANEL -->
                    <Border Background="#24160F" BorderBrush="#8B5A35" BorderThickness="1" CornerRadius="6" Padding="14">
                        <Border.Style>
                            <Style TargetType="Border">
                                <Setter Property="Visibility" Value="Collapsed"/>
                                <Style.Triggers>
                                    <DataTrigger Binding="{Binding ElementName=step2_state, Path=IsChecked}" Value="True">
                                        <Setter Property="Visibility" Value="Visible"/>
                                    </DataTrigger>
                                </Style.Triggers>
                            </Style>
                        </Border.Style>
                        <StackPanel>
                            <TextBlock Text="${escapeXml(s2.title)}" FontWeight="Bold" FontSize="12.5" Foreground="#6F9E4D" Margin="0,0,0,6"/>
                            <TextBlock Text="${escapeXml(s2.desc)}" Foreground="#F0D2A6" TextWrapping="Wrap" FontSize="12" Margin="0,0,0,10"/>
${extraControlsXaml}
                        </StackPanel>
                    </Border>

                    <!-- STEP 3 PANEL -->
                    <Border Background="#24160F" BorderBrush="#6F9E4D" BorderThickness="1" CornerRadius="6" Padding="14">
                        <Border.Style>
                            <Style TargetType="Border">
                                <Setter Property="Visibility" Value="Collapsed"/>
                                <Style.Triggers>
                                    <DataTrigger Binding="{Binding ElementName=step3_state, Path=IsChecked}" Value="True">
                                        <Setter Property="Visibility" Value="Visible"/>
                                    </DataTrigger>
                                </Style.Triggers>
                            </Style>
                        </Border.Style>
                        <StackPanel>
                            <TextBlock Text="${escapeXml(s3.title)}" FontWeight="Bold" FontSize="12.5" Foreground="#6F9E4D" Margin="0,0,0,6"/>
                            <TextBlock Text="${escapeXml(s3.desc)}" Foreground="#F0D2A6" TextWrapping="Wrap" FontSize="12" Margin="0,0,0,10"/>
                            <Border Background="#3B261A" BorderBrush="#8B5A35" BorderThickness="1" CornerRadius="5" Padding="10">
                                <StackPanel>
                                    <TextBlock Text="✓ Step 1: Input &amp; selection verified" FontSize="11.5" Foreground="#F0D2A6" Margin="0,0,0,3"/>
                                    <TextBlock Text="✓ Step 2: Tool options configured" FontSize="11.5" Foreground="#F0D2A6" Margin="0,0,0,3"/>
                                    <TextBlock Text="✓ Step 3: Click 'Run Tool' below to execute in Revit" FontSize="11.5" Foreground="#6F9E4D" FontWeight="Bold"/>
                                </StackPanel>
                            </Border>
                        </StackPanel>
                    </Border>
                </StackPanel>
            </ScrollViewer>
        </Grid>

        <!-- Multi-Step Footer Navigation -->
        <DockPanel Grid.Row="2" Margin="0,14,0,0">
            <TextBlock x:Name="footer_status" Text="Revit 2025 / 2026 / 2027" FontSize="11" Foreground="#D2A16B" VerticalAlignment="Center"/>
            <StackPanel Orientation="Horizontal" HorizontalAlignment="Right" DockPanel.Dock="Right">
                <Button x:Name="no_btn" Content="No" Width="70" Margin="0,0,8,0" Visibility="Collapsed"
                        Style="{StaticResource GrootSubBtn}"/>

                <Button x:Name="cancel_btn" Content="Cancel" Width="80" Margin="0,0,8,0" IsCancel="True"
                        Style="{StaticResource GrootSubBtn}" Click="cancel_click"/>

                <!-- Step 1 Radio State (Visible as '<- Back' when on Step 2) -->
                <RadioButton x:Name="step1_state" GroupName="GrootWizard" IsChecked="True" Content="&lt;- Back" Width="80" Margin="0,0,8,0">
                    <RadioButton.Style>
                        <Style TargetType="RadioButton" BasedOn="{StaticResource GrootWizardRadioBtn}">
                            <Setter Property="Visibility" Value="Collapsed"/>
                            <Setter Property="Background" Value="#24160F"/>
                            <Setter Property="Foreground" Value="#D2A16B"/>
                            <Setter Property="BorderBrush" Value="#8B5A35"/>
                            <Style.Triggers>
                                <DataTrigger Binding="{Binding ElementName=step2_state, Path=IsChecked}" Value="True">
                                    <Setter Property="Visibility" Value="Visible"/>
                                </DataTrigger>
                                <DataTrigger Binding="{Binding ElementName=panel_message, Path=Visibility}" Value="Collapsed">
                                    <Setter Property="Visibility" Value="Collapsed"/>
                                </DataTrigger>
                            </Style.Triggers>
                        </Style>
                    </RadioButton.Style>
                </RadioButton>

                <!-- Step 2 Radio State (Visible as 'Next Step ->' on Step 1, and '<- Back' on Step 3) -->
                <RadioButton x:Name="step2_state" GroupName="GrootWizard">
                    <RadioButton.Style>
                        <Style TargetType="RadioButton" BasedOn="{StaticResource GrootWizardRadioBtn}">
                            <Setter Property="Visibility" Value="Collapsed"/>
                            <Style.Triggers>
                                <DataTrigger Binding="{Binding ElementName=step1_state, Path=IsChecked}" Value="True">
                                    <Setter Property="Visibility" Value="Visible"/>
                                    <Setter Property="Content" Value="Next Step -&gt;"/>
                                    <Setter Property="Background" Value="#6F9E4D"/>
                                    <Setter Property="Foreground" Value="#140D09"/>
                                    <Setter Property="BorderBrush" Value="#D2A16B"/>
                                    <Setter Property="Width" Value="125"/>
                                </DataTrigger>
                                <DataTrigger Binding="{Binding ElementName=step3_state, Path=IsChecked}" Value="True">
                                    <Setter Property="Visibility" Value="Visible"/>
                                    <Setter Property="Content" Value="&lt;- Back"/>
                                    <Setter Property="Background" Value="#24160F"/>
                                    <Setter Property="Foreground" Value="#D2A16B"/>
                                    <Setter Property="BorderBrush" Value="#8B5A35"/>
                                    <Setter Property="Width" Value="80"/>
                                    <Setter Property="Margin" Value="0,0,8,0"/>
                                </DataTrigger>
                                <DataTrigger Binding="{Binding ElementName=panel_message, Path=Visibility}" Value="Collapsed">
                                    <Setter Property="Visibility" Value="Collapsed"/>
                                </DataTrigger>
                            </Style.Triggers>
                        </Style>
                    </RadioButton.Style>
                </RadioButton>

                <!-- Step 3 Radio State (Visible as 'Next Step ->' when on Step 2) -->
                <RadioButton x:Name="step3_state" GroupName="GrootWizard" Content="Next Step -&gt;" Width="125">
                    <RadioButton.Style>
                        <Style TargetType="RadioButton" BasedOn="{StaticResource GrootWizardRadioBtn}">
                            <Setter Property="Visibility" Value="Collapsed"/>
                            <Style.Triggers>
                                <DataTrigger Binding="{Binding ElementName=step2_state, Path=IsChecked}" Value="True">
                                    <Setter Property="Visibility" Value="Visible"/>
                                </DataTrigger>
                                <DataTrigger Binding="{Binding ElementName=panel_message, Path=Visibility}" Value="Collapsed">
                                    <Setter Property="Visibility" Value="Collapsed"/>
                                </DataTrigger>
                            </Style.Triggers>
                        </Style>
                    </RadioButton.Style>
                </RadioButton>

                <!-- Final Run Button (Visible on Step 3 or when in direct list/input mode) -->
                <Button x:Name="run_btn" Content="Run Tool &#10003;" MinWidth="125" IsDefault="True" Click="run_click">
                    <Button.Style>
                        <Style TargetType="Button" BasedOn="{StaticResource GrootBtn}">
                            <Setter Property="Visibility" Value="Collapsed"/>
                            <Style.Triggers>
                                <DataTrigger Binding="{Binding ElementName=step3_state, Path=IsChecked}" Value="True">
                                    <Setter Property="Visibility" Value="Visible"/>
                                </DataTrigger>
                                <DataTrigger Binding="{Binding ElementName=panel_message, Path=Visibility}" Value="Collapsed">
                                    <Setter Property="Visibility" Value="Visible"/>
                                </DataTrigger>
                            </Style.Triggers>
                        </Style>
                    </Button.Style>
                </Button>
            </StackPanel>
        </DockPanel>
    </Grid>
</Window>`;
  }

  // 96x96 Groot-Coloured Operation Icon Renderer (From Reference Studio)
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

  // Download UI & Icon Only (Never outputs script.py)
  $('dlXamlBtn').addEventListener('click', () => downloadFile('ui.xaml', generatedXaml));
  $('dlIconBtn').addEventListener('click', () => {
    canvas.toBlob(blob => downloadFile('icon.png', blob, 'image/png'), 'image/png');
  });

  $('dlZipBtn').addEventListener('click', async () => {
    const zip = new JSZip();
    zip.file('ui.xaml', generatedXaml);
    const pngBase64 = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    zip.file('icon.png', pngBase64, { base64: true });
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile('groot_ui_and_icon.zip', blob, 'application/zip');
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
    downloadFile('app.js', `${initGrootUIOnlyStudio.toString()}\ninitGrootUIOnlyStudio();\n`, 'text/javascript');
  });

  drawIcon('view_transfer');
  updateInteractivePreview();
}
initGrootUIOnlyStudio();

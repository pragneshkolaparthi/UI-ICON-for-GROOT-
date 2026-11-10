function mainStudioApp() {
  const $ = id => document.getElementById(id);
  const canvas = $('iconCanvas'), ctx = canvas.getContext('2d');
  let currentFileName = '', currentText = '', detected = 'transfer', detectedOperation = null;
  let activeTab = 'xaml';
  let uploadedBody = '        # Revit API execution logic\n        pass';

  let uiControls = [
    { type: 'TextBox', name: 'sheet_prefix_tb', label: 'Target Sheet Prefix', defaultVal: 'A-10' },
    { type: 'ComboBox', name: 'view_template_cb', label: 'View Template Override', defaultVal: 'Architectural Plan,Structural,Coordination' },
    { type: 'CheckBox', name: 'copy_schedules_cb', label: 'Include aligned schedules', defaultVal: 'True' }
  ];

  const patterns = [
    ['transfer', /(?:view|sheet|viewport).{0,55}(?:transfer|copy|move|duplicate)|(?:transfer|copy|move|duplicate).{0,55}(?:view|sheet|viewport)/gi],
    ['clash', /clash|interference|collision|conflict|coordination|navisworks|overlap/gi],
    ['stairs', /stair|riser|tread|stairpath|stair_path|up.?down/gi],
    ['schedule', /schedule|schedul|tabular|table|takeoff|quantity|qty/gi],
    ['sheets', /sheet|title.?block|drawing.?list|sheet.?number|viewport|print.?set/gi],
    ['views', /view|section|elevation|plan.?view|callout|crop.?region|view.?template/gi],
    ['walls', /wall|floor|ceiling|roof|column|beam|element|host.?object/gi],
    ['door', /door|door.?tag/gi],
    ['window', /window|glazing|curtain.?wall/gi],
    ['tag', /tag|annotation|text.?note|keynote|callout.?tag/gi],
    ['dimension', /dimension|spot.?elevation|measure|length.?value/gi],
    ['level', /level|datum|grid.?line|reference.?plane/gi],
    ['family', /family|nested|generic.?model|load.?family|parameter.?binding/gi],
    ['export', /export|publish|save.?as|write.?file|csv|excel|xlsx|pdf|dwg|ifc/gi],
    ['import', /import|read.?file|load.?data|csv.?reader|excel.?reader|link.?file/gi],
    ['model', /3d|model|geometry|solid|mesh|mass|directshape/gi]
  ];

  const titles = {
    transfer:'View / Sheet Transfer',clash:'Clash Detection',stairs:'Stair Tools',schedule:'Schedule Tools',
    sheets:'Sheet Tools',views:'View Tools',walls:'Element Tools',door:'Door Tools',window:'Window Tools',
    tag:'Tag Tools',dimension:'Dimension Tools',level:'Level Tools',family:'Family Tools',
    export:'Export Tools',import:'Import Tools',model:'Model Tools',gear:'General Revit Tool'
  };

  const operationProfiles = {
    view_transfer:{title:'Transfer views between sheets',summary:'Shows a view being transferred from a source sheet to a target sheet.',steps:['Read source sheet','Copy or move view','Place on target sheet'],art:'view_transfer'},
    viewport_place:{title:'Place a view on a sheet',summary:'Shows a Revit view being placed as a viewport on a drawing sheet.',steps:['Choose Revit view','Create viewport','Position on sheet'],art:'viewport_place'},
    view_duplicate:{title:'Duplicate a Revit view',summary:'Shows one view being duplicated into a second view.',steps:['Select source view','Duplicate view','Create new view'],art:'view_duplicate'},
    view_template:{title:'Apply a view template',summary:'Shows view settings being transferred from a template to a Revit view.',steps:['Select target view','Read template','Apply view template'],art:'view_template'},
    schedule_create:{title:'Create a Revit schedule',summary:'Shows model elements organized into a schedule table.',steps:['Collect elements','Build fields','Create schedule'],art:'schedule_create'},
    schedule_update:{title:'Update a Revit schedule',summary:'Shows schedule data refreshed from model elements.',steps:['Read schedule','Refresh data','Update schedule'],art:'schedule_create'},
    sheet_create:{title:'Create a drawing sheet',summary:'Shows a new Revit sheet created with a title block.',steps:['Choose title block','Create ViewSheet','Add sheet content'],art:'sheet_create'},
    stair_path:{title:'Generate a stair path',summary:'Shows a route drawn along stair treads with direction arrows.',steps:['Select Revit stair','Calculate route','Draw up/down path'],art:'stair_path'},
    parameter_update:{title:'Update element parameters',summary:'Shows a selected Revit element and its parameters being edited.',steps:['Find elements','Set parameters','Update element data'],art:'parameter_update'},
    tag_create:{title:'Create Revit tags',summary:'Shows a model element receiving a tag and leader annotation.',steps:['Select elements','Read tag info','Place Revit tags'],art:'tag_create'},
    dimension_create:{title:'Create dimensions',summary:'Shows two model references measured with a dimension line.',steps:['Pick references','Measure distance','Create dimension'],art:'dimension_create'},
    clash_detection:{title:'Detect model clashes',summary:'Shows two model objects intersecting and flagged as a clash.',steps:['Collect objects','Check intersections','Mark clashes'],art:'clash_detection'},
    wall_adjust:{title:'Adjust wall position',summary:'Shows a wall shifted or aligned to a new position.',steps:['Find target wall','Calculate offset','Adjust wall'],art:'wall_adjust'},
    element_move:{title:'Move Revit elements',summary:'Shows a selected model element moving to a new position.',steps:['Select elements','Apply transform','Update position'],art:'element_move'},
    element_copy:{title:'Copy Revit elements',summary:'Shows a model element copied to create a second instance.',steps:['Select source','Copy elements','Create copies'],art:'element_copy'},
    family_instance:{title:'Place a family instance',summary:'Shows a Revit family component inserted into the model.',steps:['Choose family type','Set point','Create instance'],art:'family_instance'},
    family_load:{title:'Load a Revit family',summary:'Shows a family file loaded into the active project.',steps:['Choose family file','Load definition','Use in project'],art:'family_load'},
    filter_apply:{title:'Apply a view filter',summary:'Shows model elements filtered by a Revit view filter.',steps:['Collect elements','Apply rules','Control visibility'],art:'filter_apply'},
    export_file:{title:'Export Revit information',summary:'Shows model information written out to an external file.',steps:['Collect data','Prepare data','Write output file'],art:'export_file'},
    import_file:{title:'Import external information',summary:'Shows external file data brought into a Revit workflow.',steps:['Read source file','Map data','Load information'],art:'import_file'},
    level_create:{title:'Create or manage levels',summary:'Shows level datum lines created or updated in the model.',steps:['Read level info','Create datums','Update elevations'],art:'level_create'},
    element_delete:{title:'Delete Revit elements',summary:'Shows selected model elements removed from the model.',steps:['Find elements','Validate targets','Remove elements'],art:'element_delete'},
    generic_transfer:{title:'Transfer Revit content',summary:'Shows Revit content moving from source to destination.',steps:['Read source','Transfer content','Update destination'],art:'view_transfer'},
    generic_stairs:{title:'Work with stair geometry',summary:'Shows a stair and its route or annotation operation.',steps:['Select stair','Run operation','Show result'],art:'stair_path'},
    generic_schedule:{title:'Work with a schedule',summary:'Shows Revit data arranged in a schedule table.',steps:['Collect data','Arrange fields','Show schedule'],art:'schedule_create'},
    generic_sheets:{title:'Work with drawing sheets',summary:'Shows a drawing sheet and its viewport content.',steps:['Choose sheet','Update content','Show sheet'],art:'sheet_create'},
    generic_views:{title:'Work with Revit views',summary:'Shows a Revit view frame and view operation.',steps:['Choose view','Apply operation','Update view'],art:'view_template'},
    generic_walls:{title:'Work with building elements',summary:'Shows a building element checked or adjusted.',steps:['Find elements','Apply operation','Update model'],art:'wall_adjust'},
    generic_tag:{title:'Work with annotations',summary:'Shows a model element with a Revit annotation.',steps:['Select element','Prepare tag','Place tag'],art:'tag_create'},
    generic_dimension:{title:'Work with dimensions',summary:'Shows references measured with a dimension line.',steps:['Pick references','Measure','Show dimension'],art:'dimension_create'},
    generic_family:{title:'Work with Revit families',summary:'Shows a family component and its parameter data.',steps:['Find family','Read data','Update family'],art:'family_instance'},
    generic_export:{title:'Export Revit data',summary:'Shows Revit model data sent to an output file.',steps:['Collect data','Prepare export','Create file'],art:'export_file'},
    generic_import:{title:'Import Revit data',summary:'Shows file data brought into a Revit workflow.',steps:['Read data','Map fields','Load into Revit'],art:'import_file'},
    generic_model:{title:'Work with model geometry',summary:'Shows a 3D model element selected or processed.',steps:['Select geometry','Run operation','Show result'],art:'family_instance'},
    generic_clash:{title:'Coordinate model elements',summary:'Shows intersecting model objects checked for conflicts.',steps:['Collect objects','Compare geometry','Review result'],art:'clash_detection'},
    generic_door:{title:'Work with door elements',summary:'Shows a door element with its properties.',steps:['Find doors','Read properties','Update doors'],art:'parameter_update'},
    generic_window:{title:'Work with window elements',summary:'Shows a window element with its properties.',steps:['Find windows','Read properties','Update windows'],art:'parameter_update'},
    generic_level:{title:'Work with levels and datums',summary:'Shows Revit level datum lines and elevations.',steps:['Read datums','Check elevations','Update levels'],art:'level_create'},
    generic_gear:{title:'Run a Revit operation',summary:'Shows a Revit element selected, processed, and updated.',steps:['Read inputs','Run operation','Show result'],art:'parameter_update'}
  };

  function infer(text) {
    const body = text.toLowerCase();
    const scored = patterns.map(([key, re]) => {
      re.lastIndex = 0;
      const m = body.match(re);
      return { key, score: m ? m.length : 0 };
    }).sort((a, b) => b.score - a.score);
    return scored[0] && scored[0].score > 0 ? scored[0].key : 'gear';
  }

  function detectOperation(source, kind) {
    const t = String(source || '');
    const has = re => re.test(t);
    if (has(/ViewDuplicateOption|\.Duplicate\s*\(/i) && has(/View|view/i)) return 'view_duplicate';
    if (has(/ViewTemplateId|ViewTemplate|ApplyViewTemplate/i)) return 'view_template';
    if (has(/(?:ViewSheet|Viewport|View).{0,100}(?:transfer|copy|move|duplicate)|(?:transfer|copy|move|duplicate).{0,100}(?:ViewSheet|Viewport|View)|CopyElements[\s\S]{0,180}(?:View|Sheet)|(?:View|Sheet)[\s\S]{0,180}CopyElements/i) && has(/sheet|viewport|view/i)) return 'view_transfer';
    if (has(/Viewport\.Create|CreateViewport\s*\(/i)) return 'viewport_place';
    if (has(/Stairs?Path|stair[_\s-]*path|up[_\s-]*down[_\s-]*path|stair.*(?:arrow|route)|(?:arrow|route).*stair/i)) return 'stair_path';
    if (has(/ScheduleView\.CreateSchedule|CreateSchedule\s*\(|ScheduleSheetInstance\.Create/i)) return 'schedule_create';
    if (has(/ViewSheet\.Create|CreateSheet\s*\(/i)) return 'sheet_create';
    if (has(/IndependentTag\.Create|NewTag\s*\(/i)) return 'tag_create';
    if (has(/NewDimension|Dimension\.Create|NewLinearDimension/i)) return 'dimension_create';
    if (has(/ParameterFilterElement\.Create|AddFilter\s*\(|SetFilterVisibility|SetFilterOverrides/i)) return 'filter_apply';
    if (has(/ElementTransformUtils\.MoveElement|ElementTransformUtils\.MoveElements|\.Move\s*\(/i) && has(/wall|Wall|LocationCurve|ElementTransformUtils/i)) return 'wall_adjust';
    if (has(/ElementTransformUtils\.MoveElement|ElementTransformUtils\.MoveElements|Location\.Move/i)) return 'element_move';
    if (has(/ElementTransformUtils\.CopyElements|ElementTransformUtils\.CopyElement|\bCopyElements\s*\(/i)) return 'element_copy';
    if (has(/Parameter\s*\.\s*Set|LookupParameter\s*\(|get_Parameter\s*\(|BuiltInParameter/i)) return 'parameter_update';
    if (has(/(?:clash|interference|collision|conflict|coordination|Navisworks|BooleanOperationsUtils)/i)) return 'clash_detection';
    if (has(/Stairs\.Create|StairsRun\.Create|StairsLanding\.Create|StairsRun/i)) return 'generic_stairs';
    if (has(/NewFamilyInstance|FamilyInstance|\.Place\s*\(/i)) return 'family_instance';
    if (has(/LoadFamily\s*\(|LoadFamilySymbol/i)) return 'family_load';
    if (has(/(?:Document|doc)\.Export|Export\s*\(|PrintManager|SaveAs\s*\(/i)) return 'export_file';
    if (has(/Import\s*\(|Link\s*\(|Excel|openpyxl|csv\.reader|ReadAllText/i)) return 'import_file';
    if (has(/Level\.Create|NewLevel|CreateLevel/i)) return 'level_create';
    if (has(/\.Delete\s*\(|Document\.Delete/i)) return 'element_delete';
    if (kind === 'transfer') return 'generic_transfer';
    if (kind === 'stairs') return 'generic_stairs';
    if (kind === 'schedule') return 'schedule_update';
    if (kind === 'sheets') return 'generic_sheets';
    if (kind === 'views') return 'generic_views';
    if (kind === 'walls') return 'generic_walls';
    if (kind === 'tag') return 'generic_tag';
    if (kind === 'dimension') return 'generic_dimension';
    if (kind === 'family') return 'generic_family';
    if (kind === 'export') return 'generic_export';
    if (kind === 'import') return 'generic_import';
    if (kind === 'clash') return 'generic_clash';
    if (kind === 'door') return 'generic_door';
    if (kind === 'window') return 'generic_window';
    if (kind === 'level') return 'generic_level';
    if (kind === 'model') return 'generic_model';
    return 'generic_gear';
  }

  function operationFor(kind, source) {
    const key = detectOperation(source, kind);
    return { key, ...(operationProfiles[key] || operationProfiles.generic_gear) };
  }

  function humanize(s) {
    return s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
  }

  function analyse(text, name) {
    detected = infer(text);
    detectedOperation = operationFor(detected, text);

    const titleMatch = text.match(/__title__\s*=\s*["']([^"']+)["']/);
    const docMatch = text.match(/__doc__\s*=\s*["']([^"']+)["']/);
    const baseName = humanize(name.replace(/\.py$/i, ''));
    const label = titleMatch ? titleMatch[1].replace(/\\n/g, ' ').trim() : baseName;

    $('labelInput').value = label.slice(0, 28);
    $('bundleInput').value = label.replace(/[^A-Za-z0-9]/g, '') + '.pushbutton';
    $('subtitleInput').value = docMatch ? docMatch[1].trim() : detectedOperation.summary;

    $('detectedTitle').textContent = detectedOperation.title;
    $('detectedSummary').textContent = detectedOperation.summary;

    const chips = [];
    for (const [key, re] of patterns) {
      re.lastIndex = 0;
      if (re.test(text)) chips.push(titles[key].replace(' Tools', ''));
      if (chips.length >= 4) break;
    }
    $('keywords').innerHTML = '';
    (chips.length ? chips : ['General']).forEach(t => {
      const s = document.createElement('span');
      s.className = 'chip';
      s.textContent = t;
      $('keywords').appendChild(s);
    });

    const parsedControls = [];
    const bodyLines = [];
    text.split(/\r?\n/).forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]{1,28})\s*=\s*(.+)$/);
      if (m && !m[1].startsWith('__')) {
        const varName = m[1].toLowerCase();
        const rawVal = m[2].split('#')[0].trim();
        const fLabel = humanize(varName);
        if (/^(True|False)$/i.test(rawVal)) {
          parsedControls.push({ type: 'CheckBox', name: varName + '_cb', label: fLabel, defaultVal: rawVal });
        } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
          const items = rawVal.slice(1, -1).split(',').map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean).join(',');
          parsedControls.push({ type: 'ComboBox', name: varName + '_cmb', label: fLabel, defaultVal: items || 'Option 1,Option 2' });
        } else if (/^["'\d]/.test(rawVal)) {
          parsedControls.push({ type: 'TextBox', name: varName + '_tb', label: fLabel, defaultVal: rawVal.replace(/^["']|["']$/g, '') });
        }
      } else if (!line.startsWith('__title__') && !line.startsWith('__doc__') && !line.startsWith('# -*-')) {
        bodyLines.push('        ' + line);
      }
    });

    if (parsedControls.length > 0) {
      uiControls = parsedControls;
      renderControlRows();
    }
    if (bodyLines.join('\n').trim()) {
      uploadedBody = '        ' + bodyLines.join('\n').trim();
    }

    $('analysis').classList.add('show');
    $('category').value = 'auto';
    renderAll();
  }

  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function drawOperationArtwork(art, style, accentChoice) {
    const dark = '#3B261A', bark = '#8B5A35', tan = '#D2A16B', green = accentChoice || '#6F9E4D', cream = '#F0D2A6';
    const blueprint = style === 'blueprint';
    const embossed = style === 'embossed';
    const exploded = style === 'exploded';
    const lineCol = blueprint ? tan : cream;
    const strokeW = blueprint ? 1.9 : (embossed ? 3.1 : 2.35);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    const poly = (pts, fill, stroke = lineCol, width = 1.5) => {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
    };
    const strokePath = (pts, color = lineCol, width = strokeW, dash = []) => {
      ctx.save(); ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke(); ctx.restore();
    };
    const dot = (x, y, r, color = green) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); };
    const glowDot = (x, y, r, color = green) => { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 9; dot(x, y, r, color); ctx.restore(); };
    const arrow = (x1, y1, x2, y2, color = green, w = 2.5) => {
      strokePath([[x1, y1], [x2, y2]], color, w);
      const a = Math.atan2(y2 - y1, x2 - x1), l = 6.5;
      strokePath([[x2 - l * Math.cos(a - .55), y2 - l * Math.sin(a - .55)], [x2, y2], [x2 - l * Math.cos(a + .55), y2 - l * Math.sin(a + .55)]], color, w);
    };
    const curveArrow = (pts, color = green, w = 2.5) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); ctx.stroke();
      const a = Math.atan2(pts[3][1] - pts[2][1], pts[3][0] - pts[2][0]), l = 6;
      strokePath([[pts[3][0] - l * Math.cos(a - .55), pts[3][1] - l * Math.sin(a - .55)], [pts[3][0], pts[3][1]], [pts[3][0] - l * Math.cos(a + .55), pts[3][1] - l * Math.sin(a + .55)]], color, w);
      ctx.restore();
    };
    const rounded = (x, y, w, h, r, fill, stroke = lineCol, lw = 1.6) => {
      rr(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
    };
    const isoBlock = (cx, cy, w, h, depth, top = cream, left = bark, right = dark) => {
      const pTop = [[cx, cy - h / 2], [cx + w / 2, cy - h / 4], [cx, cy], [cx - w / 2, cy - h / 4]];
      const pLeft = [[cx - w / 2, cy - h / 4], [cx, cy], [cx, cy + depth], [cx - w / 2, cy - h / 4 + depth]];
      const pRight = [[cx, cy], [cx + w / 2, cy - h / 4], [cx + w / 2, cy - h / 4 + depth], [cx, cy + depth]];
      poly(pLeft, left, lineCol, 1.35); poly(pRight, right, lineCol, 1.35); poly(pTop, top, lineCol, 1.5);
    };
    const paper = (x, y, w, h, accented = false, angle = 0) => {
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(angle); ctx.translate(-w / 2, -h / 2);
      rounded(0, 0, w, h, 3, embossed ? '#E4BD8C' : '#6E452C', lineCol, 1.2);
      poly([[w - 10, 0], [w, 10], [w - 10, 10]], accented ? green : tan, lineCol, .8);
      for (let i = 0; i < 3; i++) strokePath([[6, 13 + i * 6], [w - 7 - (i === 2 ? 7 : 0), 13 + i * 6]], i === 0 && accented ? green : tan, 1.25);
      ctx.restore();
    };
    const viewport = (x, y, w, h, highlight = false) => {
      rounded(x, y, w, h, 2, highlight ? '#6F9E4D28' : '#3B261A80', highlight ? green : tan, 1.55);
      strokePath([[x + 5, y + 7], [x + w - 5, y + 7], [x + w - 5, y + h - 6], [x + 5, y + h - 6], [x + 5, y + 7]], highlight ? cream : tan, 1);
    };
    const spark = (x, y, s = 1) => {
      strokePath([[x, y - 5 * s], [x, y + 5 * s]], cream, 1.2); strokePath([[x - 5 * s, y], [x + 5 * s, y]], cream, 1.2);
    };
    const tableCard = (x, y, w, h) => {
      rounded(x, y, w, h, 4, '#4B2E1D', tan, 1.5);
      rounded(x + 4, y + 5, w - 8, 9, 1, green + '55', green, .8);
      for (let r = 0; r < 3; r++) strokePath([[x + 4, y + 19 + r * 10], [x + w - 4, y + 19 + r * 10]], tan, .85);
    };

    if (blueprint) {
      ctx.save(); ctx.strokeStyle = '#D2A16B26'; ctx.lineWidth = .45;
      for (let x = 10; x < 90; x += 10) { ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, 86); ctx.stroke(); }
      for (let y = 10; y < 90; y += 10) { ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(86, y); ctx.stroke(); }
      ctx.restore();
    }

    switch (art) {
      case 'view_transfer':
        paper(7, 20, 33, 52, false, -.10); viewport(12, 35, 23, 22, false);
        paper(58, 17, 32, 54, true, .08); viewport(63, 32, 22, 23, true);
        curveArrow([[34, 31], [43, 15], [57, 16], [62, 25]], green, 2.9); glowDot(62, 25, 2.1); break;
      case 'viewport_place':
        paper(25, 8, 51, 77, true, -.035); viewport(33, 21, 35, 32, true);
        rounded(7, 57, 24, 20, 3, '#56351F', tan, 1.3);
        curveArrow([[24, 61], [33, 51], [43, 48], [49, 48]], green, 2.5); dot(49, 48, 2.7, green); break;
      case 'view_duplicate':
        paper(13, 24, 43, 55, false, -.10); viewport(19, 39, 30, 24, false);
        paper(42, 15, 42, 56, true, .07); viewport(48, 30, 29, 26, true);
        curveArrow([[26, 17], [35, 6], [57, 6], [66, 15]], green, 2.3); break;
      case 'view_template':
        paper(7, 25, 38, 50, false, -.07); viewport(12, 40, 27, 24, false);
        rounded(57, 18, 31, 57, 5, '#52331F', green, 1.3);
        for (let i = 0; i < 3; i++) { strokePath([[63, 31 + i * 13], [82, 31 + i * 13]], tan, 1.25); dot(68 + i * 5, 31 + i * 13, 2, green); }
        curveArrow([[43, 49], [51, 36], [56, 37], [61, 43]], green, 2.8); break;
      case 'schedule_create':
      case 'schedule_update':
        isoBlock(22, 41, 25, 25, 22, cream, bark, dark); isoBlock(31, 61, 18, 18, 15, tan, bark, dark);
        curveArrow([[38, 38], [45, 23], [55, 24], [58, 32]], green, 2.8);
        tableCard(57, 26, 31, 49); break;
      case 'sheet_create':
        paper(20, 8, 55, 79, true, -.025); viewport(27, 23, 40, 30, true);
        viewport(27, 57, 18, 17, false); viewport(49, 57, 18, 17, false); break;
      case 'stair_path':
        poly([[9,72],[21,72],[21,61],[33,61],[33,50],[45,50],[45,39],[57,39],[57,28],[70,28],[70,18],[83,18],[83,30],[77,30],[77,40],[64,40],[64,51],[52,51],[52,62],[40,62],[40,73],[28,73],[28,83],[9,83]], bark, tan, 1.2);
        strokePath([[14,69],[26,69],[26,58],[38,58],[38,47],[50,47],[50,36],[62,36],[62,25],[75,25]], green, 3.6);
        curveArrow([[66, 31], [72, 26], [76, 20], [81, 14]], green, 2.4); break;
      case 'tag_create':
        isoBlock(32, 46, 35, 31, 24, cream, bark, dark);
        strokePath([[39, 42], [55, 26], [62, 26]], green, 1.8);
        rounded(62, 15, 26, 22, 3, '#3B261A', green, 1.5); break;
      case 'dimension_create':
        isoBlock(47, 42, 38, 36, 29, cream, bark, dark);
        strokePath([[20, 19], [75, 19]], green, 2.2); arrow(20, 19, 29, 19, green, 2); arrow(75, 19, 66, 19, green, 2); break;
      case 'clash_detection':
        strokePath([[14, 25], [79, 68]], bark, 11); strokePath([[14, 25], [79, 68]], tan, 6);
        strokePath([[15, 70], [79, 23]], dark, 12); strokePath([[15, 70], [79, 23]], green, 6);
        spark(48, 47, 1.1); break;
      case 'wall_adjust':
        poly([[17, 22], [27, 17], [27, 69], [17, 74]], '#8B5A3544', tan, 1.3);
        poly([[61, 22], [71, 17], [71, 69], [61, 74]], bark, green, 1.7);
        arrow(33, 46, 56, 46, green, 2.4); break;
      case 'element_move':
      case 'element_copy':
        isoBlock(25, 44, 28, 26, 22, cream, bark, dark);
        isoBlock(69, 44, 28, 26, 22, tan, bark, green);
        curveArrow([[33, 24], [44, 8], [59, 8], [68, 23]], green, 2.7); break;
      case 'family_instance':
      case 'family_load':
        isoBlock(58, 44, 34, 32, 28, cream, bark, dark);
        curveArrow([[24, 32], [35, 16], [46, 17], [52, 29]], green, 2.6); break;
      case 'export_file':
        isoBlock(24, 46, 31, 29, 25, cream, bark, dark);
        curveArrow([[42, 36], [48, 21], [59, 21], [63, 31]], green, 2.7);
        paper(62, 25, 26, 48, true, .07); break;
      case 'import_file':
        paper(8, 24, 27, 49, false, -.06);
        curveArrow([[37, 48], [44, 34], [55, 34], [61, 46]], green, 2.7);
        isoBlock(73, 46, 29, 28, 24, cream, bark, dark); break;
      case 'level_create':
        for (let i = 0; i < 3; i++) {
          const y = 24 + i * 23;
          poly([[13, y], [36, y - 10], [84, y + 1], [61, y + 12]], i === 1 ? '#6F9E4D40' : '#8B5A353D', i === 1 ? green : tan, 1.25);
        }
        arrow(35, 78, 35, 17, green, 2); break;
      default:
        isoBlock(27, 43, 33, 31, 28, cream, bark, dark);
        rounded(53, 16, 36, 64, 5, '#4B2D1C', tan, 1.35);
        for (let i = 0; i < 3; i++) {
          rounded(59, 40 + i * 11, 23, 6, 2, '#2D1B13', tan, .6);
          rounded(59, 40 + i * 11, i === 1 ? 17 : 12, 6, 2, i === 1 ? green : bark, null, 0);
        }
        curveArrow([[42, 43], [49, 34], [51, 38], [57, 43]], green, 2.6);
    }
    if (exploded) spark(84, 14, .65);
    ctx.restore();
  }

  function renderIcon() {
    const kind = $('category').value === 'auto' ? detected : $('category').value;
    const operation = $('category').value === 'auto'
      ? (detectedOperation || operationFor(kind, currentText))
      : operationFor(kind, '');
    const style = $('style').value;
    const accent = $('color').value;

    ctx.clearRect(0, 0, 96, 96);
    const bg = ctx.createLinearGradient(4, 4, 91, 93);
    if (style === 'blueprint') {
      bg.addColorStop(0, '#50321F'); bg.addColorStop(.58, '#352116'); bg.addColorStop(1, '#24160F');
    } else if (style === 'embossed') {
      bg.addColorStop(0, '#9A6740'); bg.addColorStop(.45, '#684027'); bg.addColorStop(1, '#302015');
    } else {
      bg.addColorStop(0, '#8B5A35'); bg.addColorStop(.42, '#684027'); bg.addColorStop(1, '#2B1B12');
    }
    rr(2.5, 2.5, 91, 91, 21); ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#D2A16B88'; ctx.lineWidth = 1.1; rr(4, 4, 88, 88, 18); ctx.stroke();

    drawOperationArtwork(operation.art, style, accent);

    $('workflowSteps').innerHTML = '';
    operation.steps.forEach((label, i) => {
      const item = document.createElement('div'); item.className = 'workflow-step';
      item.innerHTML = `<span>0${i + 1}</span><b>${label}</b>`;
      $('workflowSteps').appendChild(item);
      if (i < operation.steps.length - 1) {
        const arrow = document.createElement('i'); arrow.textContent = '→';
        $('workflowSteps').appendChild(arrow);
      }
    });

    $('previewName').textContent = $('labelInput').value.trim() || 'My Revit Tool';
    $('previewSub').textContent = operation.title;
  }

  function renderControlRows() {
    const list = $('ctrlList');
    list.innerHTML = '';
    uiControls.forEach((c, idx) => {
      const row = document.createElement('div');
      row.className = 'ctrl-row';
      row.innerHTML = `
        <select data-idx="${idx}" data-key="type">
          <option value="TextBox" ${c.type === 'TextBox' ? 'selected' : ''}>TextBox</option>
          <option value="ComboBox" ${c.type === 'ComboBox' ? 'selected' : ''}>ComboBox</option>
          <option value="CheckBox" ${c.type === 'CheckBox' ? 'selected' : ''}>CheckBox</option>
        </select>
        <input type="text" data-idx="${idx}" data-key="name" value="${c.name}" />
        <input type="text" data-idx="${idx}" data-key="label" value="${c.label}" />
        <input type="text" data-idx="${idx}" data-key="defaultVal" value="${c.defaultVal}" />
        <button class="del-btn" data-del="${idx}" type="button">&times;</button>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', e => {
        uiControls[Number(e.target.dataset.idx)][e.target.dataset.key] = e.target.value;
        renderAll();
      });
    });
    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        uiControls.splice(Number(e.target.dataset.del), 1);
        renderControlRows();
        renderAll();
      });
    });
  }

  function renderWpfPreview() {
    const title = $('labelInput').value.trim() || 'My Revit Tool';
    const sub = $('subtitleInput').value.trim();
    const accent = $('color').value;

    $('wpfTitleBar').textContent = title;
    $('wpfHeader').textContent = title.toUpperCase();
    $('wpfSub').textContent = sub;
    $('wpfBanner').style.borderLeftColor = accent;
    $('wpfRunBtn').textContent = $('runBtnInput').value.trim() || 'Run Tool';
    $('wpfRunBtn').style.background = accent;
    $('wpfRunBtn').style.color = accent === '#3B261A' ? '#F0D2A6' : '#120b07';

    const fields = $('wpfFields');
    fields.innerHTML = '';
    uiControls.forEach(c => {
      const wrap = document.createElement('div');
      if (c.type === 'TextBox') {
        wrap.innerHTML = `<label class="wpf-label">${c.label}</label><input class="wpf-input" type="text" value="${c.defaultVal}" />`;
      } else if (c.type === 'ComboBox') {
        const opts = c.defaultVal.split(',').map(o => `<option>${o.trim()}</option>`).join('');
        wrap.innerHTML = `<label class="wpf-label">${c.label}</label><select class="wpf-input">${opts}</select>`;
      } else {
        const chk = /^true$/i.test(c.defaultVal.trim()) ? 'checked' : '';
        wrap.innerHTML = `<label class="wpf-check"><input type="checkbox" ${chk} style="accent-color:${accent}" /><span>${c.label}</span></label>`;
      }
      fields.appendChild(wrap);
    });
  }

  function escapeXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function generateXaml() {
    const title = escapeXml($('labelInput').value.trim() || 'Revit Tool');
    const sub = escapeXml($('subtitleInput').value.trim());
    const runText = escapeXml($('runBtnInput').value.trim() || 'Run Revit Tool');
    const accent = $('color').value;
    const height = Math.max(340, 215 + uiControls.length * 52);

    const controlsXaml = uiControls.map(c => {
      if (c.type === 'TextBox') {
        return `            <TextBlock Text="${escapeXml(c.label)}" FontWeight="SemiBold" Margin="0,0,0,4"/>\n            <TextBox x:Name="${c.name}" Text="${escapeXml(c.defaultVal)}" Margin="0,0,0,12"/>`;
      }
      if (c.type === 'ComboBox') {
        const opts = c.defaultVal.split(',').map((o, i) => `                <ComboBoxItem Content="${escapeXml(o.trim())}"${i === 0 ? ' IsSelected="True"' : ''}/>`).join('\n');
        return `            <TextBlock Text="${escapeXml(c.label)}" FontWeight="SemiBold" Margin="0,0,0,4"/>\n            <ComboBox x:Name="${c.name}" Margin="0,0,0,12" Padding="6,5">\n${opts}\n            </ComboBox>`;
      }
      const chk = /^true$/i.test(c.defaultVal.trim()) ? 'True' : 'False';
      return `            <CheckBox x:Name="${c.name}" Content="${escapeXml(c.label)}" IsChecked="${chk}" Margin="0,4,0,8"/>`;
    }).join('\n\n');

    return `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="${title}" Height="${height}" Width="430"
        WindowStartupLocation="CenterScreen"
        ResizeMode="NoResize"
        Background="#3B261A"
        Foreground="#F0D2A6"
        FontFamily="Segoe UI">

    <Window.Resources>
        <Style x:Key="GrootButton" TargetType="Button">
            <Setter Property="Background" Value="${accent}"/>
            <Setter Property="Foreground" Value="#140D09"/>
            <Setter Property="BorderBrush" Value="#D2A16B"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Padding" Value="14,8"/>
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
        </Style>
    </Window.Resources>

    <Grid Margin="18">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <Border Grid.Row="0" Background="#24160F" BorderBrush="${accent}" BorderThickness="4,0,0,0" CornerRadius="6" Padding="14,10" Margin="0,0,0,16">
            <StackPanel>
                <TextBlock Text="${title.toUpperCase()}" FontSize="15" FontWeight="Bold" Foreground="#F0D2A6"/>
                <TextBlock Text="${sub}" FontSize="11" Foreground="#D2A16B" Margin="0,2,0,0"/>
            </StackPanel>
        </Border>

        <StackPanel Grid.Row="1">
${controlsXaml}
        </StackPanel>

        <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Right" Margin="0,16,0,0">
            <Button Content="Cancel" Width="90" Margin="0,0,10,0"
                    Background="#24160F" Foreground="#D2A16B" BorderBrush="#8B5A35"
                    Style="{StaticResource GrootButton}" Click="cancel_click"/>
            <Button Content="${runText}" Width="145"
                    Style="{StaticResource GrootButton}" Click="run_click"/>
        </StackPanel>
    </Grid>
</Window>`;
  }

  function generatePython() {
    const title = $('labelInput').value.trim() || 'Revit Tool';
    const sub = $('subtitleInput').value.trim();
    const getters = uiControls.map(c => {
      if (c.type === 'TextBox') return `    @property\n    def ${c.name}_val(self):\n        return self.${c.name}.Text.strip()`;
      if (c.type === 'ComboBox') return `    @property\n    def ${c.name}_val(self):\n        return self.${c.name}.SelectedItem.Content if self.${c.name}.SelectedItem else ""`;
      return `    @property\n    def ${c.name}_val(self):\n        return bool(self.${c.name}.IsChecked)`;
    }).join('\n\n');

    return `# -*- coding: utf-8 -*-
__title__ = "${title}"
__doc__ = "${sub}"

from pyrevit import forms, revit, script


class GrootToolWindow(forms.WPFWindow):
    def __init__(self, xaml_file_name):
        forms.WPFWindow.__init__(self, xaml_file_name)

${getters}

    def run_click(self, sender, e):
        self.DialogResult = True
        self.Close()

    def cancel_click(self, sender, e):
        self.DialogResult = False
        self.Close()


ui = GrootToolWindow("ui.xaml")
if ui.show_dialog():
    output = script.get_output()
    with revit.Transaction("${title}"):
${uploadedBody}
`;
  }

  function renderAll() {
    renderIcon();
    renderWpfPreview();
    $('codeOutput').textContent = activeTab === 'xaml' ? generateXaml() : generatePython();
  }

  function showToast(msg) {
    $('toast').textContent = msg;
    $('toast').classList.add('show');
    setTimeout(() => $('toast').classList.remove('show'), 1800);
  }

  function downloadBlob(filename, content, mime = 'text/plain;charset=utf-8') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    showToast(`Downloaded ${filename}`);
  }

  function downloadIconPng() {
    renderIcon();
    canvas.toBlob(blob => downloadBlob('icon.png', blob, 'image/png'), 'image/png');
  }

  async function downloadPushbuttonZip() {
    renderAll();
    const zip = new JSZip();
    let folderName = $('bundleInput').value.trim() || 'RevitTool.pushbutton';
    if (!folderName.endsWith('.pushbutton')) folderName += '.pushbutton';

    const folder = zip.folder(folderName);
    folder.file('ui.xaml', generateXaml());
    folder.file('script.py', generatePython());
    const base64Png = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    folder.file('icon.png', base64Png, { base64: true });

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(`${folderName}.zip`, blob, 'application/zip');
  }

  // Self-contained website source exporters (works on file:// and GitHub Pages)
  function getSelfJsText() {
    return `${mainStudioApp.toString()}\nmainStudioApp();\n`;
  }

  function getSelfHtmlText() {
    return '<!doctype html>\n' + document.documentElement.outerHTML;
  }

  async function getSelfCssText() {
    try {
      const r = await fetch('style.css');
      if (r.ok) return await r.text();
    } catch (e) {}
    let css = '';
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) css += rule.cssText + '\n';
      } catch (e) {}
    }
    return css;
  }

  async function downloadWebsiteZip() {
    const zip = new JSZip();
    zip.file('index.html', getSelfHtmlText());
    zip.file('style.css', await getSelfCssText());
    zip.file('app.js', getSelfJsText());
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob('pyrevit-groot-website.zip', blob, 'application/zip');
  }

  $('dlSiteHtml').addEventListener('click', () => downloadBlob('index.html', getSelfHtmlText(), 'text/html'));
  $('dlSiteCss').addEventListener('click', async () => downloadBlob('style.css', await getSelfCssText(), 'text/css'));
  $('dlSiteJs').addEventListener('click', () => downloadBlob('app.js', getSelfJsText(), 'text/javascript'));
  $('dlSiteZip').addEventListener('click', downloadWebsiteZip);

  $('dlToolXaml').addEventListener('click', () => downloadBlob('ui.xaml', generateXaml()));
  $('dlToolPy').addEventListener('click', () => downloadBlob('script.py', generatePython()));
  $('dlToolIcon').addEventListener('click', downloadIconPng);
  $('dlToolBundle').addEventListener('click', downloadPushbuttonZip);

  $('downloadBundleBtn').addEventListener('click', downloadPushbuttonZip);
  $('downloadIconBtn').addEventListener('click', downloadIconPng);
  $('downloadXamlBtn').addEventListener('click', () => downloadBlob('ui.xaml', generateXaml()));
  $('downloadPyBtn').addEventListener('click', () => downloadBlob('script.py', generatePython()));

  $('dropzone').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      currentText = String(reader.result || '');
      currentFileName = file.name;
      $('filename').textContent = file.name;
      $('filesize').textContent = (file.size / 1024).toFixed(1) + ' KB · Read in browser';
      $('filebar').classList.add('show');
      analyse(currentText, file.name);
    };
    reader.readAsText(file);
  });

  ['dragenter', 'dragover'].forEach(ev => $('dropzone').addEventListener(ev, e => { e.preventDefault(); $('dropzone').classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => $('dropzone').addEventListener(ev, e => { e.preventDefault(); $('dropzone').classList.remove('drag'); }));
  $('dropzone').addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) {
      $('fileInput').files = e.dataTransfer.files;
      $('fileInput').dispatchEvent(new Event('change'));
    }
  });

  $('removeFile').addEventListener('click', () => {
    currentText = ''; currentFileName = '';
    $('filebar').classList.remove('show');
    $('analysis').classList.remove('show');
    renderAll();
  });

  $('loadSampleBtn').addEventListener('click', () => {
    const sample = `# -*- coding: utf-8 -*-
__title__ = "Sheet View Transfer"
__doc__ = "Copies viewports and applies view templates across target sheets"

SHEET_PREFIX = "IA-A10"
VIEW_TEMPLATE = ["Architectural Plan", "Elevation Sheet", "Section Sheet"]
COPY_SCHEDULES = True

for vp_id in source_sheet.GetAllViewports():
    Viewport.Create(doc, target_sheet.Id, view.Id, pt)
`;
    currentText = sample;
    $('filename').textContent = 'SheetViewTransfer.py';
    $('filesize').textContent = '0.4 KB · Sample loaded';
    $('filebar').classList.add('show');
    analyse(sample, 'SheetViewTransfer.py');
  });

  ['labelInput', 'bundleInput', 'subtitleInput', 'category', 'style', 'runBtnInput'].forEach(id => {
    $(id).addEventListener('input', renderAll);
  });

  document.querySelectorAll('.swatch').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      b.classList.add('active');
      $('color').value = b.dataset.color;
      renderAll();
    });
  });

  $('addCtrlBtn').addEventListener('click', () => {
    uiControls.push({ type: 'TextBox', name: `param_${uiControls.length + 1}_tb`, label: 'Parameter', defaultVal: '' });
    renderControlRows();
    renderAll();
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      renderAll();
    });
  });

  $('copyCodeBtn').addEventListener('click', () => {
    navigator.clipboard.writeText($('codeOutput').textContent);
    showToast('Code copied');
  });

  detectedOperation = operationFor('transfer', '');
  renderControlRows();
  renderAll();
}
mainStudioApp();

const PALETTES = {
  classic: {
    bg: "#2B1E16",
    surface: "#3E2C20",
    border: "#5C4332",
    accent: "#4E7A45",
    hover: "#76A85D",
    text: "#E8DEC8",
    muted: "#A69B8D"
  },
  spore: {
    bg: "#1F1916",
    surface: "#2D241E",
    border: "#4A3B32",
    accent: "#2D6A4F",
    hover: "#52B788",
    text: "#E9F5EC",
    muted: "#95B8A6"
  },
  autumn: {
    bg: "#2D1B12",
    surface: "#40271A",
    border: "#633D29",
    accent: "#9C5A25",
    hover: "#D98A3C",
    text: "#F4E3D3",
    muted: "#B89A82"
  },
  deepwood: {
    bg: "#19221B",
    surface: "#243127",
    border: "#3A4E3E",
    accent: "#4A7840",
    hover: "#80B968",
    text: "#E2ECE4",
    muted: "#98B09C"
  }
};

let state = {
  activeTab: "xaml",
  uploadedBody: "# Execute your Revit API logic inside this transaction\n        pass",
  controls: [
    { type: "TextBox", name: "prefix_tb", label: "Sheet Prefix Filter", defaultVal: "GRT-" },
    { type: "ComboBox", name: "discipline_cb", label: "Target Discipline", defaultVal: "Architectural,Structural,MEP" },
    { type: "CheckBox", name: "purge_cb", label: "Purge unused bark and vine families", defaultVal: "True" },
    { type: "CheckBox", name: "lock_cb", label: "Lock structural roots workset", defaultVal: "False" }
  ]
};

const bundleNameInput = document.getElementById("bundleName");
const themeSelect = document.getElementById("themeSelect");
const windowTitleInput = document.getElementById("windowTitle");
const windowSubtitleInput = document.getElementById("windowSubtitle");
const runBtnTextInput = document.getElementById("runBtnText");
const windowWidthInput = document.getElementById("windowWidth");
const controlsListEl = document.getElementById("controlsList");
const codeOutputEl = document.getElementById("codeOutput");
const iconCanvas = document.getElementById("iconCanvas");
const iconSymbolSelect = document.getElementById("iconSymbol");
const iconBadgeInput = document.getElementById("iconBadge");
const iconLeafSelect = document.getElementById("iconLeaf");

function init() {
  renderControlRows();
  updateAll();

  [bundleNameInput, themeSelect, windowTitleInput, windowSubtitleInput, runBtnTextInput, windowWidthInput].forEach(el => {
    el.addEventListener("input", updateAll);
  });

  [iconSymbolSelect, iconBadgeInput, iconLeafSelect].forEach(el => {
    el.addEventListener("input", drawIcon);
  });

  document.getElementById("addControlBtn").addEventListener("click", () => {
    state.controls.push({
      type: "TextBox",
      name: "param_" + (state.controls.length + 1) + "_tb",
      label: "New Parameter",
      defaultVal: ""
    });
    renderControlRows();
    updateAll();
  });

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeTab = btn.dataset.tab;
      updateCodeView();
    });
  });

  const scriptUpload = document.getElementById("scriptUpload");
  scriptUpload.addEventListener("change", e => {
    if (e.target.files.length) parseUploadedScript(e.target.files[0]);
  });

  const dropzone = document.getElementById("dropzone");
  dropzone.addEventListener("dragover", e => e.preventDefault());
  dropzone.addEventListener("drop", e => {
    e.preventDefault();
    if (e.dataTransfer.files.length) parseUploadedScript(e.dataTransfer.files[0]);
  });

  document.getElementById("loadSampleBtn").addEventListener("click", loadSampleScript);

  document.getElementById("copyCodeBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(codeOutputEl.textContent);
    const btn = document.getElementById("copyCodeBtn");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy Code"), 1500);
  });

  document.getElementById("downloadXamlBtn").addEventListener("click", () => {
    downloadTextFile("ui.xaml", generateXaml());
  });

  document.getElementById("downloadPyBtn").addEventListener("click", () => {
    downloadTextFile("script.py", generatePython());
  });

  document.getElementById("downloadIconBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "icon.png";
    link.href = iconCanvas.toDataURL("image/png");
    link.click();
  });

  document.getElementById("downloadZipBtn").addEventListener("click", downloadBundleZip);
}

function parseUploadedScript(file) {
  const reader = new FileReader();
  reader.onload = e => applyScriptParsing(file.name, e.target.result);
  reader.readAsText(file);
}

function applyScriptParsing(filename, content) {
  document.getElementById("uploadStatus").innerHTML = "Loaded <strong>" + filename + "</strong>";
  const cleanName = filename.replace(/\.py$/i, "");
  if (cleanName && cleanName !== "script") {
    bundleNameInput.value = cleanName + ".pushbutton";
  }

  const titleMatch = content.match(/__title__\s*=\s*["']([^"']+)["']/);
  if (titleMatch) windowTitleInput.value = titleMatch[1].replace(/\\n/g, " ").toUpperCase();

  const docMatch = content.match(/__doc__\s*=\s*["']([^"']+)["']/);
  if (docMatch) windowSubtitleInput.value = docMatch[1];

  const detectedControls = [];
  const lines = content.split(/\r?\n/);
  const bodyLines = [];

  lines.forEach(line => {
    const assignMatch = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
    if (assignMatch && !assignMatch[1].startsWith("__")) {
      const varName = assignMatch[1].toLowerCase();
      const rawVal = assignMatch[2].trim();
      const label = varName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

      if (/^(True|False)$/i.test(rawVal)) {
        detectedControls.push({ type: "CheckBox", name: varName + "_cb", label: label, defaultVal: rawVal });
      } else if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
        const listItems = rawVal.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean).join(",");
        detectedControls.push({ type: "ComboBox", name: varName + "_cmb", label: label, defaultVal: listItems || "Option 1,Option 2" });
      } else {
        const strVal = rawVal.replace(/^["']|["']$/g, "");
        detectedControls.push({ type: "TextBox", name: varName + "_tb", label: label, defaultVal: strVal });
      }
    } else if (!line.startsWith("__title__") && !line.startsWith("__doc__") && !line.startsWith("# -*-")) {
      bodyLines.push("        " + line);
    }
  });

  if (detectedControls.length > 0) {
    state.controls = detectedControls;
    renderControlRows();
  }

  const trimmedBody = bodyLines.join("\n").trim();
  if (trimmedBody) state.uploadedBody = "        " + trimmedBody;
  updateAll();
}

function loadSampleScript() {
  const samplePy = '# -*- coding: utf-8 -*-\n__title__ = "Groot Sheet\\nBuilder"\n__doc__ = "Batch creates architectural sheets and transfers view templates"\n\nSHEET_PREFIX = "GRT-A10"\nDISCIPLINE = ["Architectural", "Structural", "Site"]\nCOPY_VIEW_TEMPLATES = True\nLOCK_ROOT_WORKSET = False\n\nprint("Creating sheets with prefix:", ui.sheet_prefix_tb_val)\n';
  applyScriptParsing("GrootSheetBuilder.py", samplePy);
}

function renderControlRows() {
  controlsListEl.innerHTML = "";
  state.controls.forEach((ctrl, idx) => {
    const row = document.createElement("div");
    row.className = "control-item";
    row.innerHTML = `
      <select data-idx="${idx}" data-field="type">
        <option value="TextBox" ${ctrl.type === "TextBox" ? "selected" : ""}>TextBox</option>
        <option value="CheckBox" ${ctrl.type === "CheckBox" ? "selected" : ""}>CheckBox</option>
        <option value="ComboBox" ${ctrl.type === "ComboBox" ? "selected" : ""}>ComboBox</option>
      </select>
      <input type="text" data-idx="${idx}" data-field="name" value="${ctrl.name}" placeholder="x:Name" />
      <input type="text" data-idx="${idx}" data-field="label" value="${ctrl.label}" placeholder="Label" />
      <input type="text" data-idx="${idx}" data-field="defaultVal" value="${ctrl.defaultVal}" placeholder="Default / CSV" />
      <button class="control-remove" data-remove="${idx}" title="Remove">&times;</button>
    `;
    controlsListEl.appendChild(row);
  });

  controlsListEl.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", e => {
      const i = Number(e.target.dataset.idx);
      state.controls[i][e.target.dataset.field] = e.target.value;
      updateAll();
    });
  });

  controlsListEl.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", e => {
      state.controls.splice(Number(e.target.dataset.remove), 1);
      renderControlRows();
      updateAll();
    });
  });
}

function updateAll() {
  renderWpfPreview();
  updateCodeView();
  drawIcon();
}

function renderWpfPreview() {
  const p = PALETTES[themeSelect.value];
  const wpfWindow = document.getElementById("wpfWindow");
  const banner = document.getElementById("previewBanner");
  const header = document.getElementById("previewHeader");
  const subheader = document.getElementById("previewSubheader");
  const controlsBox = document.getElementById("previewControls");
  const runBtn = document.getElementById("previewRunBtn");

  wpfWindow.style.backgroundColor = p.bg;
  wpfWindow.style.color = p.text;
  wpfWindow.style.borderColor = p.border;
  wpfWindow.style.maxWidth = windowWidthInput.value + "px";

  document.getElementById("previewTitleBar").textContent = windowTitleInput.value;
  banner.style.backgroundColor = p.surface;
  banner.style.borderBottomColor = p.accent;
  header.textContent = windowTitleInput.value;
  header.style.color = p.hover;
  subheader.textContent = windowSubtitleInput.value;
  subheader.style.color = p.muted;

  runBtn.textContent = runBtnTextInput.value;
  runBtn.style.backgroundColor = p.accent;
  runBtn.style.color = p.text;
  runBtn.style.border = "1px solid " + p.hover;

  controlsBox.innerHTML = "";
  state.controls.forEach(c => {
    const wrap = document.createElement("div");
    if (c.type === "TextBox") {
      wrap.innerHTML = `<label class="wpf-field-label">${c.label}</label><input class="wpf-input" type="text" value="${c.defaultVal}" style="background:${p.surface};color:${p.text};border:1px solid ${p.border};" />`;
    } else if (c.type === "ComboBox") {
      const opts = c.defaultVal.split(",").map(o => "<option>" + o.trim() + "</option>").join("");
      wrap.innerHTML = `<label class="wpf-field-label">${c.label}</label><select class="wpf-input" style="background:${p.surface};color:${p.text};border:1px solid ${p.border};">${opts}</select>`;
    } else if (c.type === "CheckBox") {
      const checked = /^true$/i.test(c.defaultVal.trim()) ? "checked" : "";
      wrap.innerHTML = `<label class="wpf-checkbox-row"><input type="checkbox" ${checked} style="accent-color:${p.accent};" /><span>${c.label}</span></label>`;
    }
    controlsBox.appendChild(wrap);
  });
}

function generateXaml() {
  const p = PALETTES[themeSelect.value];
  const width = windowWidthInput.value || 420;
  const height = Math.max(340, 210 + state.controls.length * 52);

  const controlsXaml = state.controls.map(c => {
    if (c.type === "TextBox") {
      return `            <TextBlock Text="${escapeXml(c.label)}" FontWeight="SemiBold" Margin="0,0,0,4"/>\n            <TextBox x:Name="${c.name}" Text="${escapeXml(c.defaultVal)}" Margin="0,0,0,12"/>`;
    }
    if (c.type === "ComboBox") {
      const items = c.defaultVal.split(",").map((item, i) => `                <ComboBoxItem Content="${escapeXml(item.trim())}"${i === 0 ? ' IsSelected="True"' : ""}/>`).join("\n");
      return `            <TextBlock Text="${escapeXml(c.label)}" FontWeight="SemiBold" Margin="0,0,0,4"/>\n            <ComboBox x:Name="${c.name}" Margin="0,0,0,12" Padding="6,5">\n${items}\n            </ComboBox>`;
    }
    const isChecked = /^true$/i.test(c.defaultVal.trim()) ? "True" : "False";
    return `            <CheckBox x:Name="${c.name}" Content="${escapeXml(c.label)}" IsChecked="${isChecked}" Margin="0,4,0,8"/>`;
  }).join("\n\n");

  return `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="${escapeXml(windowTitleInput.value)}" Height="${height}" Width="${width}"
        WindowStartupLocation="CenterScreen"
        ResizeMode="NoResize"
        Background="${p.bg}"
        Foreground="${p.text}"
        FontFamily="Segoe UI">

    <Grid Margin="18">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <Border Grid.Row="0" Background="${p.surface}" BorderBrush="${p.accent}" BorderThickness="0,0,0,3" CornerRadius="6" Padding="14,10" Margin="0,0,0,16">
            <StackPanel>
                <TextBlock Text="${escapeXml(windowTitleInput.value)}" FontSize="16" FontWeight="Bold" Foreground="${p.hover}"/>
                <TextBlock Text="${escapeXml(windowSubtitleInput.value)}" FontSize="11" Foreground="${p.muted}" Margin="0,2,0,0"/>
            </StackPanel>
        </Border>

        <StackPanel Grid.Row="1">
${controlsXaml}
        </StackPanel>

        <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Right" Margin="0,16,0,0">
            <Button Content="Cancel" Width="90" Margin="0,0,10,0" Background="${p.surface}" Foreground="${p.muted}" BorderBrush="${p.border}" Click="cancel_click"/>
            <Button Content="${escapeXml(runBtnTextInput.value)}" Width="145" Background="${p.accent}" Foreground="${p.text}" BorderBrush="${p.hover}" Click="run_click"/>
        </StackPanel>
    </Grid>
</Window>`;
}

function generatePython() {
  const propsCode = state.controls.map(c => {
    if (c.type === "TextBox") return `    @property\n    def ${c.name}_val(self):\n        return self.${c.name}.Text.strip()`;
    if (c.type === "ComboBox") return `    @property\n    def ${c.name}_val(self):\n        return self.${c.name}.SelectedItem.Content if self.${c.name}.SelectedItem else ""`;
    return `    @property\n    def ${c.name}_val(self):\n        return bool(self.${c.name}.IsChecked)`;
  }).join("\n\n");

  return `# -*- coding: utf-8 -*-
__title__ = "${windowTitleInput.value}"
__doc__ = "${windowSubtitleInput.value}"

from pyrevit import forms, revit, script


class GrootToolWindow(forms.WPFWindow):
    def __init__(self, xaml_file_name):
        forms.WPFWindow.__init__(self, xaml_file_name)

${propsCode}

    def run_click(self, sender, e):
        self.DialogResult = True
        self.Close()

    def cancel_click(self, sender, e):
        self.DialogResult = False
        self.Close()


ui = GrootToolWindow("ui.xaml")
if ui.show_dialog():
    output = script.get_output()
    with revit.Transaction("${windowTitleInput.value}"):
${state.uploadedBody}
`;
}

function updateCodeView() {
  codeOutputEl.textContent = state.activeTab === "xaml" ? generateXaml() : generatePython();
}

function drawIcon() {
  const ctx = iconCanvas.getContext("2d");
  const p = PALETTES[themeSelect.value];
  ctx.clearRect(0, 0, 96, 96);

  ctx.fillStyle = p.bg;
  roundRect(ctx, 4, 4, 88, 88, 16);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = p.accent;
  roundRect(ctx, 6, 6, 84, 84, 14);
  ctx.stroke();

  ctx.fillStyle = p.hover;
  ctx.strokeStyle = p.hover;
  ctx.lineWidth = 3.5;

  const sym = iconSymbolSelect.value;
  if (sym === "sprout") {
    ctx.beginPath();
    ctx.moveTo(48, 58);
    ctx.lineTo(48, 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(39, 34, 10, 6, -0.5, 0, Math.PI * 2);
    ctx.ellipse(57, 30, 10, 6, 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (sym === "sheets") {
    ctx.strokeRect(30, 22, 36, 32);
  } else if (sym === "tag") {
    ctx.strokeRect(28, 26, 40, 24);
  } else if (sym === "gear") {
    ctx.beginPath();
    ctx.arc(48, 38, 12, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(48, 32, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(45, 42, 6, 16);
  }

  const badgeText = (iconBadgeInput.value || "GRT").toUpperCase();
  ctx.fillStyle = p.surface;
  roundRect(ctx, 18, 62, 60, 22, 6);
  ctx.fill();

  ctx.fillStyle = p.text;
  ctx.font = "bold 13px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, 48, 73);

  if (iconLeafSelect.value === "yes") {
    ctx.fillStyle = p.hover;
    ctx.beginPath();
    ctx.ellipse(76, 18, 7, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

async function downloadBundleZip() {
  const zip = new JSZip();
  let folderName = bundleNameInput.value.trim() || "GrootTool.pushbutton";
  if (!folderName.endsWith(".pushbutton")) folderName += ".pushbutton";

  const bundle = zip.folder(folderName);
  bundle.file("ui.xaml", generateXaml());
  bundle.file("script.py", generatePython());

  const dataUrl = iconCanvas.toDataURL("image/png");
  bundle.file("icon.png", dataUrl.replace(/^data:image\/png;base64,/, ""), { base64: true });

  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(content);
  link.download = folderName + ".zip";
  link.click();
}

init();
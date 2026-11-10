:root {
  --bg: #120b07;
  --panel: #1f140d;
  --panel2: #2a1b12;
  --line: #4b3120;
  --muted: #b59b82;
  --text: #f5e6d3;
  --dark-bark: #3B261A;
  --bark-brown: #8B5A35;
  --warm-wood: #D2A16B;
  --leaf-green: #6F9E4D;
  --leaf-bright: #9ce57f;
  --cream: #F0D2A6;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background:
    radial-gradient(ellipse at 12% 0%, #3b261a 0, transparent 38%),
    linear-gradient(145deg, #100a06, #1c110b 62%, #120b07);
  color: var(--text);
  font: 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  min-height: 100vh;
}

.direct-download-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #180f0a;
  border-bottom: 2px solid var(--leaf-green);
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  box-shadow: 0 8px 24px #00000080;
}

.bar-group {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.bar-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.9px;
  color: var(--warm-wood);
  margin-right: 4px;
}

.dl-chip {
  background: #2b1c12;
  color: var(--cream);
  border: 1px solid var(--bark-brown);
  border-radius: 7px;
  padding: 6px 11px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.15s;
}

.dl-chip:hover {
  border-color: var(--leaf-bright);
  background: #3B261A;
}

.dl-chip.accent {
  background: var(--bark-brown);
  color: #120b07;
  border-color: var(--warm-wood);
}

.dl-chip.primary {
  background: linear-gradient(100deg, var(--leaf-bright), var(--leaf-green));
  color: #10220c;
  border-color: var(--leaf-bright);
}

.shell {
  max-width: 1320px;
  margin: auto;
  padding: 24px 22px 56px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 750;
}

.brandmark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(145deg, var(--leaf-bright), var(--leaf-green));
  display: grid;
  place-items: center;
  color: #12210e;
  font-weight: 900;
  box-shadow: 0 8px 24px #6f9e4d50;
}

.brand small {
  display: block;
  color: var(--warm-wood);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.local-pill {
  font-size: 12px;
  color: var(--cream);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 7px 11px;
  background: #1a110b;
}

.hero {
  max-width: 780px;
  margin: 0 0 26px;
}

.eyebrow {
  color: var(--leaf-bright);
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 1.7px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

h1 {
  font-size: clamp(30px, 4.2vw, 48px);
  line-height: 1.06;
  letter-spacing: -1.4px;
  margin: 0 0 14px;
  font-weight: 780;
}

h1 span { color: var(--warm-wood); }

.hero p {
  color: var(--muted);
  font-size: 15px;
  margin: 0;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(380px, 0.92fr);
  gap: 20px;
  align-items: start;
}

.panel {
  background: linear-gradient(160deg, #23160ef2, #180f0af5);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 18px 50px #00000066;
  overflow: hidden;
  margin-bottom: 18px;
}

.panel-head {
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-head h2 {
  font-size: 15px;
  margin: 0;
  font-weight: 720;
}

.step {
  font-size: 11px;
  color: var(--warm-wood);
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.panel-body { padding: 20px; }

.dropzone {
  border: 1.5px dashed var(--bark-brown);
  border-radius: 14px;
  background: linear-gradient(145deg, #2b1b12, #1f140d);
  padding: 24px 18px;
  text-align: center;
  transition: 0.18s;
  cursor: pointer;
}

.dropzone:hover, .dropzone.drag {
  border-color: var(--leaf-bright);
  background: #322015;
}

.upload-icon {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: #3B261A;
  color: var(--leaf-bright);
  border: 1px solid var(--leaf-green);
  display: grid;
  place-items: center;
  margin: 0 auto 10px;
}

.dropzone strong {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
}

.dropzone p {
  color: var(--muted);
  margin: 0;
  font-size: 12.5px;
}

.drop-note {
  margin-top: 8px !important;
  font-size: 11px !important;
}

.browse {
  color: var(--leaf-bright);
  font-weight: 700;
  text-decoration: underline;
}

input[type=file] { display: none; }

.filebar {
  display: none;
  margin-top: 12px;
  padding: 10px 13px;
  background: #150d08;
  border: 1px solid var(--line);
  border-radius: 11px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.filebar.show { display: flex; }

.filename {
  font-size: 13px;
  font-weight: 700;
}

.filesize {
  font-size: 11px;
  color: var(--muted);
}

.text-btn {
  border: 0;
  background: none;
  color: var(--leaf-bright);
  font-weight: 700;
  cursor: pointer;
}

.analysis {
  margin-top: 16px;
  display: none;
}

.analysis.show { display: block; }

.analysis h3 {
  font-size: 11.5px;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: var(--warm-wood);
  margin: 0 0 8px;
}

.detected {
  padding: 13px 14px;
  background: #160e09;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.detected-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 750;
  margin-bottom: 4px;
  color: var(--cream);
}

.detected p {
  color: var(--muted);
  font-size: 12.5px;
  margin: 0;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 9px;
}

.chip {
  font-size: 11px;
  color: var(--cream);
  background: #2e1f14;
  border: 1px solid var(--bark-brown);
  padding: 2px 8px;
  border-radius: 99px;
}

.workflow-card {
  margin-top: 10px;
  padding: 12px 13px;
  background: #1b110b;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.workflow-heading {
  font-size: 10.5px;
  color: var(--warm-wood);
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 9px;
}

.workflow-steps {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 6px;
}

.workflow-step {
  padding: 7px 6px;
  background: #120b07;
  border: 1px solid var(--line);
  border-radius: 8px;
  text-align: center;
}

.workflow-step span {
  display: block;
  color: var(--bark-brown);
  font-size: 9px;
  font-weight: 850;
}

.workflow-step b {
  display: block;
  color: var(--cream);
  font-size: 11px;
  line-height: 1.25;
}

.workflow-steps i {
  font-style: normal;
  color: var(--leaf-green);
  font-size: 14px;
  font-weight: 900;
}

.workflow-note {
  font-size: 10.5px;
  color: var(--muted);
  margin: 8px 0 0;
}

.section-label {
  font-size: 11.5px;
  color: var(--warm-wood);
  letter-spacing: 1.1px;
  text-transform: uppercase;
  font-weight: 750;
  margin: 20px 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field.full { grid-column: 1 / -1; }

label {
  display: block;
  font-size: 11.5px;
  color: var(--cream);
  font-weight: 650;
  margin: 0 0 6px;
}

input[type=text], select {
  width: 100%;
  border: 1px solid var(--line);
  background: #130c08;
  color: var(--text);
  border-radius: 9px;
  padding: 9px 11px;
  font: inherit;
  font-size: 12.5px;
  outline: none;
}

input[type=text]:focus, select:focus {
  border-color: var(--leaf-green);
}

.swatches {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.swatch {
  width: 26px;
  height: 26px;
  border: 2px solid #ffffff44;
  border-radius: 50%;
  cursor: pointer;
}

.swatch.active, .swatch:hover {
  outline: 2px solid var(--leaf-bright);
  outline-offset: 2px;
}

.ctrl-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.ctrl-row {
  display: grid;
  grid-template-columns: 105px 1fr 1.1fr 1fr auto;
  gap: 7px;
  align-items: center;
  background: #160e09;
  border: 1px solid var(--line);
  padding: 7px;
  border-radius: 9px;
}

.del-btn {
  background: #381914;
  color: #ff9d88;
  border: 1px solid #5e2a20;
  border-radius: 7px;
  width: 28px;
  height: 32px;
  cursor: pointer;
  font-weight: 800;
}

.preview-area {
  padding: 20px;
  background: radial-gradient(ellipse at center, #2e1e14 0, #1b110b 75%);
}

.preview-split {
  display: grid;
  grid-template-columns: 175px 1fr;
  gap: 16px;
  align-items: start;
}

.icon-card {
  text-align: center;
  background: #140c08;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px 10px;
}

.icon-frame {
  width: 128px;
  height: 128px;
  margin: 0 auto 10px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: #0d0805;
  border: 1px solid var(--bark-brown);
}

canvas {
  width: 108px;
  height: 108px;
}

.preview-name {
  font-size: 13.5px;
  font-weight: 750;
}

.preview-sub {
  font-size: 11px;
  color: var(--muted);
}

.wpf-mock {
  background: #3B261A;
  border: 1.5px solid #8B5A35;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 12px 30px #0009;
}

.wpf-titlebar {
  background: #23150e;
  color: #D2A16B;
  padding: 6px 12px;
  font-size: 11.5px;
  font-weight: 650;
  display: flex;
  justify-content: space-between;
}

.wpf-body { padding: 14px; }

.wpf-banner {
  background: #281910;
  border-left: 4px solid #6F9E4D;
  border-radius: 6px;
  padding: 8px 11px;
  margin-bottom: 12px;
}

.wpf-banner-title {
  font-size: 13px;
  font-weight: 800;
  color: #F0D2A6;
}

.wpf-banner-sub {
  font-size: 11px;
  color: #D2A16B;
}

.wpf-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wpf-label {
  font-size: 11px;
  font-weight: 650;
  color: #F0D2A6;
  margin-bottom: 3px;
  display: block;
}

.wpf-input {
  width: 100%;
  background: #24160F;
  border: 1px solid #8B5A35;
  color: #F0D2A6;
  padding: 6px 8px;
  border-radius: 5px;
  font-size: 12px;
}

.wpf-check {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #F0D2A6;
}

.wpf-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #593822;
}

.wpf-btn {
  padding: 6px 12px;
  border-radius: 5px;
  font-size: 11.5px;
  font-weight: 700;
  border: 1px solid #8B5A35;
}

.wpf-btn.cancel {
  background: #24160F;
  color: #D2A16B;
}

.wpf-btn.run {
  background: #6F9E4D;
  color: #120b07;
}

.actions {
  padding: 16px 20px;
  display: grid;
  gap: 8px;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

button {
  font: inherit;
  cursor: pointer;
  border: 0;
  border-radius: 10px;
  font-weight: 750;
}

.primary {
  background: linear-gradient(100deg, var(--leaf-bright), var(--leaf-green));
  color: #10210d;
  padding: 12px 15px;
}

.secondary {
  background: #2b1c12;
  border: 1px solid var(--bark-brown);
  color: var(--cream);
  padding: 9px 12px;
  font-size: 12px;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 11.5px;
}

.tab-group {
  display: flex;
  gap: 6px;
}

.tab-btn {
  background: #150d08;
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.tab-btn.active {
  background: var(--leaf-green);
  color: #120b07;
  font-weight: 800;
}

.code-view {
  margin: 0;
  padding: 13px;
  background: #0e0906;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--cream);
  font: 12px/1.45 Consolas, monospace;
  max-height: 290px;
  overflow: auto;
  white-space: pre;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translate(-50%, 20px);
  opacity: 0;
  pointer-events: none;
  background: var(--leaf-bright);
  color: #10220c;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  transition: 0.22s;
}

.toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

@media (max-width: 940px) {
  .workspace, .preview-split, .action-row { grid-template-columns: 1fr; }
}

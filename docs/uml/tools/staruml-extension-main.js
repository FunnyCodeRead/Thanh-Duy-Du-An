const { ipcRenderer } = require("electron");
function log(m) { try { ipcRenderer.send("console-log", "[aigen] " + m); } catch (e) {} }
function build(arg) {
  const scriptPath = arg || process.env.AIGEN_SCRIPT;
  try {
    delete require.cache[require.resolve(scriptPath)];
    const fn = require(scriptPath);
    fn(app, type, log);
    log("DONE");
  } catch (err) {
    log("ERROR " + (err && err.stack ? err.stack : err));
  }
}
function init() { app.commands.register("aigen:build", build); }
exports.init = init;

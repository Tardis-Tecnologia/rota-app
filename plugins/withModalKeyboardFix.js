const { withMainActivity } = require('expo/config-plugins');

const marker = '// Prevent modal typing from triggering the debug double-R reload shortcut.';

function patchMainActivity(contents) {
  if (contents.includes(marker)) return contents;
  const declaration = 'class MainActivity : ReactActivity() {';
  if (!contents.includes(declaration)) {
    throw new Error('withModalKeyboardFix: MainActivity declaration not found');
  }
  return contents.replace(declaration, `${declaration}
  ${marker}
  override fun onKeyUp(keyCode: Int, event: android.view.KeyEvent): Boolean {
    // Dialogs forward key-up events, but Activity.currentFocus belongs to the
    // underlying window and cannot identify the dialog's focused TextInput.
    if (keyCode == android.view.KeyEvent.KEYCODE_R && !hasWindowFocus()) {
      return false
    }
    return super.onKeyUp(keyCode, event)
  }
`);
}

module.exports = (config) => withMainActivity(config, (config) => {
  if (config.modResults.language !== 'kt') {
    throw new Error('withModalKeyboardFix requires a Kotlin MainActivity');
  }
  config.modResults.contents = patchMainActivity(config.modResults.contents);
  return config;
});

module.exports.patchMainActivity = patchMainActivity;

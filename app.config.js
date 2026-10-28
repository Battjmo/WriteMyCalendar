const { withEntitlementsPlist } = require("expo/config-plugins");

// Extends app.json. Set NO_APPLE_SIGNIN=1 when prebuilding to drop the Sign in with Apple
// entitlement, which lets `expo run:ios` build for a simulator without a signing certificate.
// Expo auto-applies the expo-apple-authentication plugin whenever the package is installed,
// so the entitlement has to be removed directly rather than by filtering `plugins`.
module.exports = ({ config }) => {
  if (process.env.NO_APPLE_SIGNIN !== "1") return config;
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["com.apple.developer.applesignin"];
    return config;
  });
};

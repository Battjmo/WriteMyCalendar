// Requires Metro started with EXPO_PUBLIC_E2E=true (npm run start:e2e) so the
// camera preview is swapped out and Detox synchronization can go idle.
describe('Camera screen', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      url: 'exp+writemycalendar://expo-development-client/?url=' + encodeURIComponent('http://localhost:8081'),
      permissions: { camera: 'YES' },
    });
  });

  it('shows the take photo button', async () => {
    await expect(element(by.id('take_photo_button'))).toBeVisible();
  });
});

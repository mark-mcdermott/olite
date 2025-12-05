import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Olite App', () => {
  test('should launch and take screenshot', async () => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js')],
    });

    // Get the first window
    const window = await electronApp.firstWindow();

    // Wait for the app to load
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(2000); // Give extra time for rendering

    // Take a screenshot
    await window.screenshot({ path: 'tests/e2e/screenshots/app.png' });

    // Close the app
    await electronApp.close();
  });

  test('should verify sidebar border color', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(2000);

    // Get computed style of sidebars by checking elements with explicit border styles
    const borderColors = await window.evaluate(() => {
      // Find sidebars by their width classes
      const farLeftSidebar = document.querySelector('.w-\\[44px\\]');
      const leftSidebar = document.querySelector('.w-\\[260px\\]');

      const results: Record<string, string | null> = {};

      if (farLeftSidebar) {
        const style = window.getComputedStyle(farLeftSidebar);
        results.farLeftSidebar = style.borderRightColor;
      }

      if (leftSidebar) {
        const style = window.getComputedStyle(leftSidebar);
        results.leftSidebar = style.borderRightColor;
      }

      return results;
    });

    console.log('Sidebar border colors:', borderColors);

    // Verify border colors are #e0e0e0 (rgb(224, 224, 224))
    expect(borderColors.farLeftSidebar).toBe('rgb(224, 224, 224)');
    expect(borderColors.leftSidebar).toBe('rgb(224, 224, 224)');

    // Take screenshot for visual verification
    await window.screenshot({ path: 'tests/e2e/screenshots/sidebar-border.png' });

    await electronApp.close();
  });
});

import asyncio
from playwright.async_api import async_playwright, Page, expect

async def main():
    """
    This test verifies that the new Projects feature is working.
    It navigates to the projects view, clicks on a project,
    and verifies the detail view is shown.
    """
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch()
        page = await browser.new_page()
        print("Browser launched.")

        try:
            # 1. Navigate to the app
            print("Navigating to http://localhost:1420...")
            await page.goto("http://localhost:1420")
            print("Waiting for network to be idle...")
            await page.wait_for_load_state('networkidle')
            print("Navigation successful.")

            # 2. Click on the "Projects" navigation item
            print("Looking for 'Projects' link...")
            projects_link = page.get_by_role("button", name="Projects")
            await expect(projects_link).to_be_visible(timeout=10000)
            print("'Projects' link found. Clicking...")
            await projects_link.click()
            print("'Projects' link clicked.")

            # 3. Verify the Projects view is loaded
            print("Verifying 'Projects' heading...")
            await expect(page.get_by_role("heading", name="Projects")).to_be_visible()
            print("'Projects' heading verified.")

            # 4. Click on the "View Details" button for the first project
            print("Looking for 'View Details' button...")
            view_details_button = page.get_by_role("button", name="View Details").first
            await expect(view_details_button).to_be_visible()
            print("'View Details' button found. Clicking...")
            await view_details_button.click()
            print("'View Details' button clicked.")

            # 5. Verify the Project Detail view is loaded
            print("Verifying detail view elements...")
            await expect(page.get_by_role("button", name="← Back to Projects")).to_be_visible()
            await expect(page.get_by_role("heading", name="Project Phoenix")).to_be_visible()
            await expect(page.get_by_role("heading", name="Workflows")).to_be_visible()
            await expect(page.get_by_role("heading", name="Migration Wave 1")).to_be_visible()
            print("Detail view elements verified.")

            # 6. Take a screenshot
            screenshot_path = "jules-scratch/verification/verification.png"
            print(f"Taking screenshot at {screenshot_path}...")
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()
            print("Browser closed.")

if __name__ == "__main__":
    asyncio.run(main())

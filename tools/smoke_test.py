#!/usr/bin/env python3
"""Small browser regression check for the static project page."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
CHROMIUM = Path(os.environ["CHROMIUM_PATH"]) if "CHROMIUM_PATH" in os.environ else None
URL = (ROOT / "index.html").as_uri()


def test_page(browser, width: int, height: int) -> None:
    page = browser.new_page(viewport={"width": width, "height": height})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL, wait_until="load", timeout=60000)
    page.wait_for_timeout(600)
    assert page.title() == "UPCAST | Factorized World Transitions"
    assert page.locator('a[href$="paper.pdf"]').count() == 0
    assert page.locator("#driftChart path").count() == 2
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"horizontal overflow at {width}px"

    if width > 760:
        page.screenshot(path="/tmp/upcast-final-desktop-hero.png")
    else:
        page.locator("#menuToggle").click()
        assert page.locator("#mobileNav").is_visible()
        page.locator("#menuToggle").click()
        assert not page.locator("#mobileNav").is_visible()
        page.screenshot(path="/tmp/upcast-final-mobile-hero.png")

    page.locator('[data-scene="kitchen"]').click()
    assert "kitchen-upcast.mp4" in page.locator("#compareOurs source").get_attribute("src")
    page.locator("#comparePlay").click()
    page.wait_for_timeout(500)
    assert page.locator("#compareOurs").evaluate("e => e.videoWidth") == 256
    page.locator("#comparePlay").click()
    page.locator("#compareSeek").evaluate("e => { e.value = 32; e.dispatchEvent(new Event('input', {bubbles:true})); }")
    assert "33" in page.locator("#compareFrame").inner_text()

    page.locator('[data-mode="physical"]').click()
    assert "100%" in page.locator("#factorRGB").get_attribute("style")
    page.locator('[data-mode="appearance"]').click()
    assert "inset(0px)" in page.locator("#factorRGB").get_attribute("style")
    page.locator('[data-mode="unified"]').click()
    page.locator("#factorSplit").evaluate("e => { e.value = 68; e.dispatchEvent(new Event('input', {bubbles:true})); }")
    assert "68%" in page.locator("#factorRGB").get_attribute("style")

    page.locator('[data-geo-view="depth"]').click()
    assert "geometry-upcast-depth.mp4" in page.locator("#geoOurs source").get_attribute("src")
    page.locator('[data-chart="long"]').click()
    assert page.locator('[data-chart="long"]').get_attribute("aria-pressed") == "true"
    assert page.locator("#driftChart path").count() == 2
    page.locator("#horizonSeek").evaluate("e => { e.value = 128; e.dispatchEvent(new Event('input', {bubbles:true})); }")
    assert "129" in page.locator("#horizonFrame").inner_text()

    page.locator("#method").scroll_into_view_if_needed()
    assert page.locator(".method-figure img").evaluate("e => e.complete && e.naturalWidth > 0")
    page.locator(".method-figure [data-figure]").click()
    assert page.locator("#figureDialog").is_visible()
    page.locator("#figureClose").click()
    assert not page.locator("#figureDialog").is_visible()

    for selector, filename in (("#explore", "explore"), ("#factorization", "factor"), ("#horizon", "horizon"), ("#geometry", "geometry"), ("#method", "method")):
        page.locator(selector).scroll_into_view_if_needed()
        page.wait_for_timeout(150)
        page.screenshot(path=f"/tmp/upcast-final-{width}-{filename}.png")

    assert not errors, errors
    page.close()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        launch_options = {"headless": True, "args": ["--no-sandbox"]}
        if CHROMIUM:
            launch_options["executable_path"] = str(CHROMIUM)
        browser = playwright.chromium.launch(**launch_options)
        for viewport in ((1440, 900), (390, 844)):
            test_page(browser, *viewport)
            print(f"OK {viewport[0]}x{viewport[1]}")
        browser.close()

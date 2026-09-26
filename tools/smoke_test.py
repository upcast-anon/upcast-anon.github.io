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
    assert page.locator("#horizonOurs").count() == 0
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"horizontal overflow at {width}px"

    if width > 760:
        page.screenshot(path="/tmp/upcast-final-desktop-hero.png")
    else:
        page.locator("#menuToggle").click()
        assert page.locator("#mobileNav").is_visible()
        page.locator("#menuToggle").click()
        assert not page.locator("#mobileNav").is_visible()
        page.screenshot(path="/tmp/upcast-final-mobile-hero.png")

    page.locator('[data-idea="factorized"]').click()
    assert "intro-factorized.png" in page.locator("#ideaPanelImage").get_attribute("src")
    page.locator('[data-scene="living"]').click()
    assert "living-upcast.mp4" in page.locator("#compareOurs source").get_attribute("src")
    page.locator("#comparePlay").click()
    page.wait_for_timeout(500)
    assert page.locator("#compareOurs").evaluate("e => e.videoWidth") == 256
    page.locator("#comparePlay").click()
    page.locator("#compareSeek").evaluate("e => { e.value = 32; e.dispatchEvent(new Event('input', {bubbles:true})); }")
    assert "33" in page.locator("#compareFrame").inner_text()

    page.locator('[data-method="transfer"]').click()
    assert page.locator('[data-method-panel="transfer"]').is_visible()
    page.locator('[data-method="deploy"]').click()
    assert page.locator('[data-method-panel="deploy"]').is_visible()
    page.locator('[data-method="acquire"]').click()
    page.locator('[data-feature="vjepa"]').click()
    assert "regularizer" in page.locator("#featureExplain").inner_text()
    page.locator('[data-geo-view="depth"]').click()
    assert "geometry-upcast-depth-17.jpg" in page.locator("#geoOurs").get_attribute("src")
    assert "geometry-upcast-depth-17.jpg" in page.locator("#geoOursFull").get_attribute("src")
    page.locator("#geoFrameRange").evaluate("e => { e.value = 8; e.dispatchEvent(new Event('input', {bubbles:true})); }")
    assert "geometry-upcast-depth-64.jpg" in page.locator("#geoOurs").get_attribute("src")
    assert "geometry-geometry-forcing-depth-64.jpg" in page.locator("#geoGFFull").get_attribute("src")
    assert "geometry-reference-64.jpg" in page.locator("#geoReference").get_attribute("src")
    page.locator("#geometryCompare").scroll_into_view_if_needed()
    bounds = page.locator("#geometryCompare").bounding_box()
    page.mouse.move(bounds["x"] + bounds["width"] * .7, bounds["y"] + bounds["height"] * .5)
    page.mouse.down()
    page.mouse.up()
    assert page.locator("#geoHandle").get_attribute("aria-valuenow") == "70"
    page.locator("#geoHandle").focus()
    page.keyboard.press("ArrowRight")
    assert page.locator("#geoHandle").get_attribute("aria-valuenow") == "75"
    assert page.locator("#driftChart path").count() == 2

    page.locator("#method").scroll_into_view_if_needed()
    page.locator(".method-paper summary").click()
    page.locator(".method-paper img").first.scroll_into_view_if_needed()
    page.wait_for_function("document.querySelector('.method-paper img').complete && document.querySelector('.method-paper img').naturalWidth > 0")
    assert page.locator(".method-paper img").first.evaluate("e => e.complete && e.naturalWidth > 0")
    page.locator(".method-paper [data-figure]").click()
    assert page.locator("#figureDialog").is_visible()
    page.locator("#figureClose").click()
    assert not page.locator("#figureDialog").is_visible()

    for selector, filename in (("#idea", "idea"), ("#explore", "explore"), ("#temporal", "temporal"), ("#method", "method"), ("#geometry", "geometry"), ("#results", "results")):
        page.locator(selector).scroll_into_view_if_needed()
        page.wait_for_timeout(150)
        page.screenshot(path=f"/tmp/upcast-final-{width}-{filename}.png")

    assert page.locator(".results-table td:last-child").first.evaluate(
        "e => e.getBoundingClientRect().right <= e.closest('.results-table-wrap').getBoundingClientRect().right + 1"
    ), f"results table clipped at {width}px"
    assert page.evaluate("[...document.images].every(image => !image.complete || image.naturalWidth > 0)"), "broken image"
    assert not errors, errors
    page.close()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        launch_options = {"headless": True, "args": ["--no-sandbox"]}
        if CHROMIUM:
            launch_options["executable_path"] = str(CHROMIUM)
        browser = playwright.chromium.launch(**launch_options)
        for viewport in ((320, 700), (390, 844), (768, 1024), (1440, 900), (1920, 1080)):
            test_page(browser, *viewport)
            print(f"OK {viewport[0]}x{viewport[1]}")
        browser.close()

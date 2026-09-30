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
    assert page.locator("#horizonTable tbody tr").count() == 5
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"horizontal overflow at {width}px"
    assert page.locator('#compareOurs').evaluate('e => e.currentTime') < .5
    assert '100 matched videos' in page.locator('#horizonCaption').text_content()

    if width > 860:
        page.screenshot(path="/tmp/upcast-final-desktop-hero.png")
    else:
        page.locator("#menuToggle").click()
        assert page.locator("#mobileNav").is_visible()
        page.locator("#menuToggle").click()
        assert not page.locator("#mobileNav").is_visible()
        page.screenshot(path="/tmp/upcast-final-mobile-hero.png")

    for step in ('alignment', 'factorized', 'generation'):
        page.locator(f'[data-idea="{step}"]').click()
        assert page.locator('#ideaPanelArt .motion-svg').count() == 1
        assert page.locator('#ideaPanelArt .motion-trace').count() >= 2
        page.wait_for_function("document.querySelector('#ideaPanelImage').complete && document.querySelector('#ideaPanelImage').naturalWidth > 0")
        assert page.locator('#ideaPanelImage').evaluate(
            'e => e.getBoundingClientRect().bottom <= e.parentElement.getBoundingClientRect().bottom + 1'
        ), f'guided figure clipped at {width}px: {step}'
    page.locator('[data-idea="factorized"]').click()
    assert "intro-factorized.png" in page.locator("#ideaPanelImage").get_attribute("src")
    assert page.locator('#ideaAuto').get_attribute('aria-label') == 'Pause guided walkthrough'
    page.locator('#ideaAuto').click()
    assert page.locator('#ideaPanelArt .motion-canvas').evaluate(
        "e => e.getAnimations({subtree:true}).some(a => a.playState === 'paused')"
    )
    assert page.locator('#ideaPanelArt .motion-viewport').evaluate('e => e.scrollWidth <= e.clientWidth + 1')
    assert page.locator('.full-paper-figure img').count() == 2
    page.locator('[data-scene="entryway"]').click()
    assert "entryway-upcast.mp4" in page.locator("#compareOurs source").get_attribute("src")
    page.wait_for_function("document.querySelector('#compareOurs').readyState >= 1")
    assert page.locator('#compareOurs').evaluate('e => e.currentTime') < .5
    page.locator("#comparePlay").click()
    page.wait_for_timeout(500)
    assert page.locator("#compareOurs").evaluate("e => e.videoWidth") == 256
    page.locator("#comparePlay").click()
    page.locator("#compareSeek").evaluate("e => { e.value = 32; e.dispatchEvent(new Event('input', {bubbles:true})); }")
    assert "33" in page.locator("#compareFrame").inner_text()

    page.locator('[data-method="transfer"]').click()
    assert page.locator('[data-method-panel="transfer"]').is_visible()
    assert page.locator('[data-method-panel="transfer"] .motion-svg').count() == 1
    page.locator('[data-method="deploy"]').click()
    assert page.locator('[data-method-panel="deploy"]').is_visible()
    page.locator('[data-method="acquire"]').click()
    assert page.locator('#methodAuto').get_attribute('aria-label') == 'Pause method walkthrough'
    page.locator('#methodAuto').click()
    page.locator('[data-feature="vjepa"]').click()
    assert "regularizer" in page.locator("#featureExplain").inner_text()
    page.locator('[data-stage-metric="jedi"]').click()
    assert '5.90' in page.locator('#stagePlot').text_content()
    page.locator('[data-stage-metric="psnr"]').click()
    assert '14.30' in page.locator('#stagePlot').text_content()
    page.locator('[data-stage-metric="fvd"]').click()
    page.locator('[data-geo-view="depth"]').click()
    assert "geometry-hallway-upcast-depth-17.jpg" in page.locator("#geoOurs").get_attribute("src")
    assert "reference-rgb-17.jpg" in page.locator("#geoReference").get_attribute("src")
    assert "reference-depth-17.jpg" in page.locator("#geoSensor").get_attribute("src")
    page.locator('[data-geo-view="error"]').click()
    assert "geometry-hallway-upcast-error-17.jpg" in page.locator("#geoOurs").get_attribute("src")
    assert page.locator('#depthLegend').is_visible()
    page.locator('[data-geo-scene="poster"]').click()
    assert "geometry-poster-upcast-error-17.jpg" in page.locator("#geoOurs").get_attribute("src")
    assert "0.149" in page.locator('#geoSceneAbsRel').inner_text()
    page.locator("#geoFrameRange").evaluate("e => { e.value = 8; e.dispatchEvent(new Event('input', {bubbles:true})); }")
    assert "geometry-poster-upcast-error-64.jpg" in page.locator("#geoOurs").get_attribute("src")
    assert "geometry-poster-geometry-forcing-error-64.jpg" in page.locator("#geoGFFull").get_attribute("src")
    assert "geometry-poster-reference-rgb-64.jpg" in page.locator("#geoReference").get_attribute("src")
    assert "geometry-poster-reference-depth-64.jpg" in page.locator("#geoSensor").get_attribute("src")
    assert page.locator('.geometry-views figure').count() == 4
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
    page.locator(".method-full img").first.scroll_into_view_if_needed()
    page.wait_for_function("document.querySelector('.method-full img').complete && document.querySelector('.method-full img').naturalWidth > 0")
    assert page.locator(".method-full img").first.evaluate("e => e.complete && e.naturalWidth > 0")
    page.locator(".method-full [data-figure]").click()
    assert page.locator("#figureDialog").is_visible()
    page.locator("#figureClose").click()
    assert not page.locator("#figureDialog").is_visible()

    page.locator('[data-horizon="256"]').click()
    assert '1217.6' in page.locator('#horizonTable').inner_text()
    assert page.locator('#horizonTable tbody tr.ours-row .metric-best').count() == 3
    page.locator('[data-horizon="64"]').click()
    assert page.locator('#horizonTable tbody tr.ours-row .metric-best').count() == 5
    assert page.locator('#horizonTable tbody tr:nth-child(4) .metric-best').count() == 2
    page.locator('.complete-metrics summary').first.click()
    assert '29.13' in page.locator('.complete-metrics').first.inner_text()
    assert page.locator('.complete-metrics').first.locator('.results-table tbody tr.ours-row .metric-best').count() == 7
    page.locator('.action-metrics summary').click()
    assert '89.78%' in page.locator('.action-metrics').inner_text()
    for selector, filename in (("#idea", "idea"), ("#explore", "explore"), ("#temporal", "temporal"), ("#method", "method"), ("#geometry", "geometry"), ("#results", "results"), ("#evidence", "evidence"), ("#resources", "resources")):
        page.locator(selector).scroll_into_view_if_needed()
        page.wait_for_timeout(150)
        page.screenshot(path=f"/tmp/upcast-final-{width}-{filename}.png")

    assert page.locator('#horizonTable').evaluate('e => e.querySelectorAll("tbody tr").length === 5')
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
        reduced = browser.new_page(reduced_motion="reduce")
        reduced.goto(URL, wait_until="load")
        assert reduced.locator('#ideaPanelArt .motion-svg').count() == 1
        assert reduced.locator('[data-method-panel="acquire"] .motion-svg').count() == 1
        assert reduced.locator('#ideaPanelArt .motion-rise').first.evaluate(
            "e => getComputedStyle(e).opacity === '1'"
        )
        reduced.close()
        print("OK reduced motion")
        browser.close()

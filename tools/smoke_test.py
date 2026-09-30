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
    page.locator('#ideaAuto').click()
    assert page.locator('#ideaAuto').get_attribute('aria-label') == 'Pause guided walkthrough'
    page.locator('#ideaAuto').click()
    assert page.locator('#ideaPanelArt .motion-canvas').evaluate(
        "e => e.getAnimations({subtree:true}).some(a => a.playState === 'paused')"
    )
    if width <= 560:
        page.locator('#ideaPanelArt .motion-pan-nav button').nth(1).click()
        page.wait_for_timeout(400)
        assert page.locator('#ideaPanelArt .motion-viewport').evaluate('e => e.scrollLeft') > 0
        page.locator('#ideaPanelArt .motion-pan-nav button').first.click()
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
    page.locator('#methodAuto').click()
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


def test_motion_timing(browser) -> None:
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL, wait_until="load")
    page.locator('[data-idea="factorized"]').click()
    assert page.locator('.idea-motion .motion-trace').first.evaluate(
        "e => Math.abs(parseFloat(getComputedStyle(e).strokeDasharray) - e.getTotalLength()) < 1"
    )
    page.evaluate("window.previousCanvas = document.querySelector('.idea-motion')")
    page.locator('[data-idea="generation"]').click()
    assert page.evaluate("!window.previousCanvas.isConnected")
    assert page.locator('.idea-motion').evaluate(
        "e => new DOMMatrix(getComputedStyle(e, '::after').transform).a < .25"
    )
    page.locator('[data-idea="factorized"]').click()
    page.locator('#ideaAuto').click()
    page.wait_for_timeout(650)
    page.locator('#ideaAuto').click()
    page.wait_for_timeout(80)
    frozen = page.locator('.idea-motion').evaluate(
        "e => e.getAnimations({subtree:true}).filter(a => a.playState === 'paused').map(a => a.currentTime)"
    )
    assert frozen
    page.wait_for_timeout(500)
    resumed = page.locator('.idea-motion').evaluate(
        "e => e.getAnimations({subtree:true}).filter(a => a.playState === 'paused').map(a => a.currentTime)"
    )
    assert len(frozen) == len(resumed)
    assert max(abs(before - after) for before, after in zip(frozen, resumed)) < 2
    page.locator('#ideaAuto').click()
    page.wait_for_function("document.querySelector('[data-idea=generation]').classList.contains('active')", timeout=7000)
    page.locator('[data-method="transfer"]').click()
    page.wait_for_timeout(3900)
    assert page.locator('[data-method-panel="transfer"] .motion-trace.dashed').first.evaluate(
        "e => getComputedStyle(e).opacity === '0' && getComputedStyle(e.nextElementSibling).opacity === '1'"
    )
    for step in ('acquire', 'transfer', 'deploy'):
        page.locator(f'[data-method="{step}"]').click()
        assert page.locator(f'[data-method-panel="{step}"] .motion-svg').evaluate("""svg => {
          const {width, height} = svg.viewBox.baseVal;
          return [...svg.querySelectorAll('text')].every(text => {
            const box = text.getBBox();
            return box.x >= -1 && box.x + box.width <= width + 1 &&
              box.y >= -1 && box.y + box.height <= height + 1;
          }) && [...svg.querySelectorAll('text.motion-box-title')].every(text => {
            const title = text.getBBox();
            const frame = text.previousElementSibling.getBBox();
            return title.x >= frame.x - 1 && title.x + title.width <= frame.x + frame.width + 1;
          });
        }""")
    page.locator('[data-method="acquire"]').click()
    assert page.locator('[data-method-panel="acquire"] .motion-svg').evaluate("""svg => {
      const rvq = [...svg.querySelectorAll('.motion-box-title')].find(t => t.textContent === 'RVQ').parentElement;
      const path = [...svg.querySelectorAll('.motion-trace')].find(p => p.getAttribute('d').startsWith('M479 139'));
      return parseFloat(rvq.style.getPropertyValue('--delay')) <=
        parseFloat(path.style.getPropertyValue('--delay')) + parseFloat(path.style.getPropertyValue('--draw-duration'));
    }""")
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
        test_motion_timing(browser)
        print("OK motion timing")
        browser.close()

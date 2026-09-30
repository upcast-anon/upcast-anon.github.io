#!/usr/bin/env python3
"""Check responsive diagram geometry, theme persistence and animation playback."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', args=['--no-sandbox'])
    for width in (320, 390, 768, 1440, 1920):
        page = browser.new_page(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto((ROOT / 'index.html').as_uri(), wait_until='load')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
        assert '100 matched' in page.locator('#horizonCaption').text_content()
        assert page.locator('.results-lead-summary').count() == 0
        assert page.locator('#compareOurs').evaluate('v => v.currentTime') < .5
        for kind, steps in [('idea', ['alignment', 'factorized', 'generation']), ('method', ['acquire', 'transfer', 'deploy'])]:
            sizes = []
            for step in steps:
                page.locator(f'[data-{kind}="{step}"]').click()
                svg = page.locator('.idea-motion svg' if kind == 'idea' else f'[data-method-panel="{step}"] .motion-svg')
                problems = svg.evaluate('''svg => {
                  const errors=[], {width:w,height:h}=svg.viewBox.baseVal;
                  for(const text of svg.querySelectorAll('text')){
                    const b=text.getBBox();
                    if(b.x<0||b.y<0||b.x+b.width>w+.5||b.y+b.height>h+.5) errors.push(`Outside SVG: ${text.textContent}`);
                    const node=text.closest('.motion-node');
                    if(node){const frame=node.querySelector('rect').getBBox();
                      if(b.x<frame.x+5||b.x+b.width>frame.x+frame.width-5||b.y<frame.y||b.y+b.height>frame.y+frame.height) errors.push(`Outside node: ${text.textContent}`);
                    }
                  }
                  for(const path of svg.querySelectorAll('.motion-trace')){
                    for(let d=0;d<=path.getTotalLength();d+=3){const p=path.getPointAtLength(d);
                      for(const node of svg.querySelectorAll('.motion-node>rect:first-child')){const b=node.getBBox();
                        if(p.x>b.x+2&&p.x<b.x+b.width-2&&p.y>b.y+2&&p.y<b.y+b.height-2) errors.push(`Path through ${node.parentElement.dataset.title}`);
                      }
                    }
                  }
                  return [...new Set(errors)];
                }''')
                assert not problems, (width, kind, step, problems)
                sizes.append(svg.bounding_box()['height'])
                if width in (390,1440):
                    svg.screenshot(path=f'/tmp/upcast-audit-{width}-{kind}-{step}.png')
            assert max(sizes)-min(sizes)<2, (width, kind, sizes)
        page.locator('#themeToggle').click()
        assert page.locator('html').get_attribute('data-theme') == 'dark'
        page.reload(wait_until='load')
        assert page.locator('html').get_attribute('data-theme') == 'dark'
        for section in ('geometry','evidence','resources','results'):
            if width in (390,1440):
                page.locator('#'+section).screenshot(path=f'/tmp/upcast-audit-{width}-dark-{section}.png')
        assert not errors, errors
        page.close()
        print(f'PASS {width}px: all six diagrams, text bounds, paths, stable sizing, theme and initial media state', flush=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.goto((ROOT/'index.html').as_uri())
    page.locator('[data-idea="factorized"]').click()
    assert page.locator('#ideaAuto').get_attribute('aria-label') == 'Pause guided walkthrough'
    page.wait_for_timeout(900)
    page.locator('#ideaAuto').click()
    times=page.locator('.idea-motion').evaluate('e=>e.getAnimations({subtree:true}).map(a=>a.currentTime)')
    page.wait_for_timeout(250)
    later=page.locator('.idea-motion').evaluate('e=>e.getAnimations({subtree:true}).map(a=>a.currentTime)')
    assert all(abs(a-b)<2 for a,b in zip(times,later))
    assert page.locator('.motion-rise').first.evaluate('e=>getComputedStyle(e).transform') == 'none'
    page.locator('#ideaAuto').click()
    page.wait_for_function("document.querySelector('[data-idea=generation]').classList.contains('active')", timeout=11000)
    print('PASS animation pause, resume, tab synchronization and fixed node positions', flush=True)
    browser.close()

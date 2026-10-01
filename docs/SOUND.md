# Sound

The speaker button and “The Hugo Tron World” label stay fixed together at the upper
left throughout the home journey, including loading, scene transitions, video sheets,
and the static fallback. They sit outside the fading/inert hero section. There is only
one home sound button. Other pages keep their control by the navigation.

Sound defaults to enabled, pending the first trusted click/tap (pointer release) or
Enter/Space key. No AudioContext or audio downloads start before that gesture.
Scrolling and hovering alone do not bypass browser autoplay restrictions. The armed
button has still wave lines; they animate only once playback starts (static with
reduced motion). Pressing it before the first gesture cancels the default-on setting
without starting audio. Its pressed state represents the sound preference.

Explicit mute persists in `hugo-sound-enabled` across reloads and navigation; blocked
storage still preserves it for the current document. Sound remains enabled through
client-side navigation. Hidden tabs suspend the AudioContext; returning fades it in
only if still enabled. The master gain rises from silence to 0.65 over 3.5 seconds;
mute interrupts that ramp and reaches silence in 120 ms.

The current soundtrack uses the owner's uploads, preserved at the public root:

| Source                | Optimized file in `public/audio/world/` | Use                         |
| --------------------- | --------------------------------------- | --------------------------- |
| `BackgroundMusic.mp3` | `background.mp3`                        | Continuous background music |
| `MenuNavEtc.mp3`      | `menu.mp3`                              | Hover and product selection |
| `FLyAway.mp3`         | `fly-away.mp3`                          | Scene/video transitions     |
| `Click.wav`           | `click.mp3`                             | Button and link activation  |
| `ItemAddedInCart.wav` | `cart-added.mp3`                        | Successful cart additions   |

Run `python3 scripts/prepare-world-audio.py` to reproduce the delivery files. Music
uses 128 kbps stereo MP3 and effects use 96 kbps. Sample rates and source dynamics
are preserved; the two WAV effects get 3 dB of encoding headroom to protect their
transients. The new click/cart files total about 28 KB. A 1.5-second end-to-start
crossfade makes the music a roughly
28.5-second loop, avoiding a hard restart. Only the optimized files are requested.
The prior synthesized samples remain in `public/audio/` but are not in the mix.

`src/lib/sound/manifest.ts` owns asset paths, mix levels and cooldowns. Swap files there
to change the palette. `useSound().play("product" | "hover" | "transition" | "click" | "cart")`
triggers a cue. The hover and product cues share one download and decoded buffer at
different gains; five assets load. Missed cues during loading, mute or hidden tabs
are discarded. The engine allows at most three effect tails alongside the ambient
loop and rate-limits repeated interactions. Cart confirmation takes priority over
an older effect tail if all three slots are occupied.

Trusted button/link activations play the click cue through the shared provider,
including keyboard and touch clicks. Disabled controls, the sound toggle, and
`data-sound-click="none"` opt-outs are silent. Add-to-cart buttons use that opt-out:
the shared `CartProvider.addItem` plays confirmation only after the accepted cart
quantity actually increases. Hydration, rejected/capped additions, quantity edits,
and removals do not play the success cue. A future asynchronous cart adapter should
keep that cue on confirmed success rather than on the initial button press.

Use `data-sound-hover` on intentional interactive controls. Child pointer movements
and touch-generated hovers do not retrigger sounds. Use `useChapterSound(elementRef)`
for future scroll chapters: it fires once after scrolling into a previously offscreen
section, not on page load or every scroll frame. Scroll cues are connected to the rice
page. The home flight plays the supplied fly-away cue after leaving the hero; it
rearms only after returning to the hero. Changing the active video sheet also uses
this cue, with a cooldown to prevent repeated sound during rapid scrolling.

Use the Web Audio API's [user gesture and gain scheduling guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
when extending the engine. There is no audio framework dependency.

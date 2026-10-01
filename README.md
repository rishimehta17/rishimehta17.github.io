# Rishi Mehta Robotics

A static site (HTML, CSS, JS). No build step, no dependencies.

```
index.html
style.css
script.js
assets/
  rishi.jpg               <- your photo in the intro (square crop)
  pickandplace.mp4        <- the demo video (plays on the page)
  poster.jpg              <- the frame shown before playing
  gripper-*.jpg           <- photos that fade in the Hardware card
  camera-mount*.jpg       <- photos that fade in the Sensing card
  Rishi_Mehta_Resume.pdf
  favicon.svg
  og.png                  <- social preview image
```

## Publish on GitHub Pages

1. Put all these files in the root of your repository (or the folder your Pages site serves).
2. Repository Settings, Pages, deploy from the `main` branch.
3. In `index.html`, update the `og:image` URL to your final address so link previews work.

## Change the demo video

The demo plays on the page from `assets/pickandplace.mp4`. To replace it, export an H.264 MP4 with the same name and replace `assets/poster.jpg` with a frame from it. Keep the file under about 15 MB so it loads quickly. Example with ffmpeg:

```
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k assets/pickandplace.mp4
ffmpeg -ss 44 -i input.mov -frames:v 1 -vf scale=1600:-2 -q:v 3 assets/poster.jpg
```

The caption also links to the YouTube version. Change that link in `index.html` (search for `youtu.be`).

## Change the intro photo

Replace `assets/rishi.jpg` with a square JPG (about 1100 x 1100). The caption under it is the `<figcaption class="portrait-cap">` in `index.html`. The blue glow is `.portrait-glow` in `style.css`; change `6s` in the `breathe` animation to speed it up or slow it down.

## Change the fading photos

The Hardware and Sensing cards each show a photo slideshow. The photos are in `assets/` and listed in `index.html` inside `data-shots` blocks. Each photo is one `<figure class="shot">` with a caption in `data-cap`. Use 4:3 landscape JPGs around 1400 x 1050 (about 100 to 150 KB each). To add a photo, copy a `<figure>` line; the dots add themselves. Timing is `HOLD` (how long a photo stays) in the "photo slideshows" section of `script.js`.

## Change the rotating role line

In `script.js`, edit the `roles` list near the top of the "typewriter role line" section. Each entry is `[article, word]`, for example `['an', 'engineer']`. The typing line shows the article and corrects it between words.

## Edit the copy

All text lives in `index.html`. Colors, fonts and spacing are tokens at the top of `style.css`.

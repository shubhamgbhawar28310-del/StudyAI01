# Video Hosting Solutions for Large Files (67MB)

## 🎯 Problem
GitHub warns about files larger than 50MB. Your `demo-video.mp4` is 67.34 MB.

## ✅ Solutions

### Option 1: YouTube Embed (Recommended - Free & Fast)

**Steps:**
1. Upload video to YouTube: https://youtube.com/upload
2. Set visibility to "Unlisted" (not public, but accessible via link)
3. Get video ID from URL (e.g., `dQw4w9WgXcQ`)
4. Update code:

```tsx
// src/components/landing/HeroSection.tsx
<div className="aspect-video relative overflow-hidden bg-black">
  <iframe
    className="w-full h-full"
    src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=YOUR_VIDEO_ID"
    title="StudyAI Demo"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
</div>
```

**Pros:**
- ✅ Free unlimited hosting
- ✅ Fast global CDN
- ✅ No file size limits
- ✅ Professional player with controls

---

### Option 2: Cloudinary (Free Tier - 25GB)

**Steps:**
1. Sign up: https://cloudinary.com (free account)
2. Upload your video
3. Get the video URL
4. Update code:

```tsx
<video 
  className="w-full h-full object-contain"
  autoPlay
  muted
  loop
  playsInline
  controls
>
  <source src="https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/demo-video.mp4" type="video/mp4" />
</video>
```

**Pros:**
- ✅ Free 25GB storage
- ✅ Video optimization & compression
- ✅ Fast CDN delivery
- ✅ Easy to use

---

### Option 3: Compress Video (Keep in GitHub)

Reduce video size to under 50MB using compression:

**Using HandBrake (Free):**
1. Download: https://handbrake.fr/
2. Open your video
3. Settings:
   - Preset: "Web" → "Discord Nitro Large 3-6 Minute"
   - Video Codec: H.264
   - Quality: RF 23-25 (lower = better quality)
   - Resolution: 1920x1080 or 1280x720
4. Save and replace `public/demo-video.mp4`

**Using FFmpeg (Command Line):**
```bash
ffmpeg -i public/demo-video.mp4 -vcodec h264 -crf 28 -preset medium public/demo-video-compressed.mp4
```

**Pros:**
- ✅ No external dependencies
- ✅ Keeps video in your repo
- ✅ Fast loading

**Cons:**
- ❌ Some quality loss
- ❌ Still counts toward repo size

---

### Option 4: Git LFS (GitHub Large File Storage)

**Steps:**
1. Install Git LFS: https://git-lfs.github.com/
2. Initialize in your repo:
```bash
git lfs install
git lfs track "*.mp4"
git add .gitattributes
```
3. Add and commit video:
```bash
git add public/demo-video.mp4
git commit -m "Add video with LFS"
git push origin main
```

**Pros:**
- ✅ Keeps video in GitHub
- ✅ No external hosting needed

**Cons:**
- ❌ Free tier: 1GB storage, 1GB bandwidth/month
- ❌ Costs money after free tier
- ❌ Requires Git LFS setup

---

## 🎯 Recommended Approach

**For your use case, I recommend:**

### **YouTube (Unlisted)** - Best for demos
- Upload to YouTube as "Unlisted"
- Embed in your landing page
- Free, fast, unlimited bandwidth

### **Or Cloudinary** - Best for control
- Upload to Cloudinary free tier
- Keep full control over video
- Automatic optimization

---

## 🚀 Quick Implementation (YouTube)

1. **Upload to YouTube**
   - Go to: https://studio.youtube.com
   - Click "Create" → "Upload videos"
   - Upload your `demo-video.mp4`
   - Set visibility: **Unlisted**
   - Copy video ID from URL

2. **Update HeroSection.tsx**
   Replace the video section with YouTube embed (see code above)

3. **Commit and push**
   ```bash
   git add src/components/landing/HeroSection.tsx
   git commit -m "Use YouTube embed for demo video"
   git push origin main
   ```

4. **Optional: Remove large video from GitHub**
   ```bash
   git rm public/demo-video.mp4
   git commit -m "Remove large video file"
   git push origin main
   ```

---

## 📊 Comparison

| Solution | Cost | Speed | Quality | Ease |
|----------|------|-------|---------|------|
| YouTube | Free | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Cloudinary | Free (25GB) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Compress | Free | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Git LFS | $5/mo after 1GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## 💡 My Recommendation

**Use YouTube (Unlisted):**
- Takes 5 minutes to set up
- Professional video player
- Zero cost, unlimited bandwidth
- Works perfectly for landing page demos

Let me know which option you prefer, and I'll help you implement it!

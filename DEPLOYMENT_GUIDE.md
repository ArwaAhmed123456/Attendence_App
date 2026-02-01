# 🚀 Complete Deployment Guide

This guide will walk you through deploying your Attendance Mobile App from start to finish.

## 📋 Prerequisites Checklist

- [ ] GitHub account (free)
- [ ] Render.com account (free tier available)
- [ ] Expo account (free)
- [ ] Google Play Developer account ($25 one-time) - for Android
- [ ] Apple Developer account ($99/year) - for iOS (optional, can do later)

---

## Phase 1: Deploy Backend to Render.com (FREE)

### Step 1: Push Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   cd c:\Users\uk354\Downloads\Attendence_Mob_App
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Name it: `attendance-mobile-app`
   - Don't initialize with README (you already have code)
   - Click "Create repository"

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/attendance-mobile-app.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Render.com

1. **Sign up for Render**:
   - Go to https://render.com
   - Click "Get Started for Free"
   - Sign up with GitHub (recommended)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `attendance-mobile-app`
   - Render will auto-detect the `render.yaml` file

3. **Configure Environment Variables**:
   Click "Environment" and add these variables:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `JWT_SECRET` | (generate random: see below) |
   | `EMAIL_SERVICE` | `gmail` |
   | `EMAIL_USER` | `2020muhammadwaqar@gmail.com` |
   | `EMAIL_PASSWORD` | `B2irjqj2` |
   | `EMAIL_FROM` | `Attendance Pro <2020muhammadwaqar@gmail.com>` |

   **Generate JWT_SECRET**: Run this in PowerShell:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Your app will be live at: `https://attendance-mobile-app-XXXX.onrender.com`

5. **Test Your Backend**:
   - Visit: `https://your-app-url.onrender.com`
   - You should see: "Attendance API Running"
   - Privacy policy: `https://your-app-url.onrender.com/privacy-policy.html`

> **⚠️ Important**: Free tier apps sleep after 15 minutes of inactivity. First request may take 30-60 seconds to wake up.

---

## Phase 2: Update Mobile App with Production URL

### Step 1: Update API Configuration

Edit `mobile/src/services/api.js`:

```javascript
// Replace this line:
const API_BASE_URL = 'http://192.168.100.173:5000/api';

// With your Render URL:
const API_BASE_URL = 'https://your-app-name.onrender.com/api';
```

### Step 2: Update App Configuration

Edit `mobile/app.json` and add:

```json
{
  "expo": {
    "name": "Attendance Mobile App",
    "slug": "attendance-mobile-app",
    "version": "1.0.0",
    "description": "Professional attendance tracking app for construction sites and projects",
    "privacy": "public",
    "platforms": ["ios", "android"],
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.hayat123a.attendancemobileapp",
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.hayat123a.attendancemobileapp",
      "versionCode": 1,
      "permissions": ["INTERNET", "ACCESS_NETWORK_STATE"]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": ["expo-router"],
    "extra": {
      "privacyPolicyUrl": "https://your-app-name.onrender.com/privacy-policy.html"
    }
  }
}
```

---

## Phase 3: Build Mobile Apps with EAS

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

Create an Expo account if you don't have one: https://expo.dev/signup

### Step 3: Configure EAS Build

```bash
cd mobile
eas build:configure
```

This will update your `eas.json` file.

### Step 4: Build for Android

```bash
eas build --platform android --profile production
```

- First build takes 10-20 minutes
- You'll get a link to download the `.aab` file
- Free tier: 30 builds/month

### Step 5: Build for iOS (if you have Apple Developer account)

```bash
eas build --platform ios --profile production
```

- Requires Apple Developer account
- First build takes 15-25 minutes
- You'll get a link to download the `.ipa` file

---

## Phase 4: Submit to App Stores

### Google Play Store

1. **Create Google Play Developer Account**:
   - Go to https://play.google.com/console/signup
   - Pay $25 one-time fee
   - Complete registration

2. **Create App**:
   - Click "Create app"
   - Fill in app details:
     - Name: "Attendance Mobile App"
     - Default language: English
     - App or game: App
     - Free or paid: Free

3. **Upload Build**:
   - Go to "Production" → "Create new release"
   - Upload the `.aab` file from EAS
   - Fill in release notes

4. **Complete Store Listing**:
   - **App details**: Description, category (Business/Productivity)
   - **Graphics**: Screenshots (at least 2), feature graphic
   - **Privacy policy**: `https://your-app-name.onrender.com/privacy-policy.html`
   - **Content rating**: Complete questionnaire

5. **Submit for Review**:
   - Review everything
   - Click "Submit for review"
   - Typical review time: 1-3 days

### Apple App Store

1. **Create Apple Developer Account**:
   - Go to https://developer.apple.com/programs/enroll/
   - Pay $99/year
   - Wait 24-48 hours for approval

2. **Create App in App Store Connect**:
   - Go to https://appstoreconnect.apple.com
   - Click "+" → "New App"
   - Fill in details:
     - Platform: iOS
     - Name: "Attendance Mobile App"
     - Bundle ID: `com.hayat123a.attendancemobileapp`
     - SKU: `attendance-mobile-app-001`

3. **Upload Build**:
   ```bash
   eas submit --platform ios
   ```
   Or use Transporter app to upload the `.ipa` file

4. **Complete App Information**:
   - **Description**: Detailed app description
   - **Keywords**: attendance, timesheet, construction, tracking
   - **Screenshots**: Required for iPhone and iPad
   - **Privacy policy URL**: `https://your-app-name.onrender.com/privacy-policy.html`
   - **Category**: Business or Productivity

5. **Submit for Review**:
   - Add app review information
   - Submit for review
   - Typical review time: 1-7 days

---

## 📱 Testing Before Submission

### Test Production Build Locally

**Android:**
```bash
eas build --platform android --profile preview
```
Download and install the APK on your Android device.

**iOS:**
```bash
eas build --platform ios --profile preview
```
Install via TestFlight or direct installation.

### What to Test:
- [ ] Login with admin credentials
- [ ] Create a new project
- [ ] Mark attendance (time in/out)
- [ ] View attendance logs
- [ ] Test password reset flow
- [ ] Test on different screen sizes
- [ ] Test offline behavior

---

## 🔄 Updating Your App

### Backend Updates

1. Make changes to code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. Render auto-deploys (takes 2-3 minutes)

### Mobile App Updates

1. Update version in `app.json`:
   ```json
   "version": "1.0.1",
   "android": { "versionCode": 2 },
   "ios": { "buildNumber": "1.0.1" }
   ```

2. Build new version:
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

3. Submit to stores (same process as initial submission)

---

## 💰 Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Render.com (Free) | $0 | 750 hours/month, sleeps after 15min |
| Render.com (Starter) | $7/mo | Always on, better performance |
| Google Play | $25 | One-time fee |
| Apple Developer | $99/yr | Required for iOS |
| EAS Build (Free) | $0 | 30 builds/month |
| EAS Build (Production) | $29/mo | Unlimited builds, priority |

**Minimum to start**: $25 (Android only)  
**Both platforms**: $124 first year, $99/year after

---

## 🆘 Troubleshooting

### Backend Issues

**App not accessible:**
- Check Render dashboard for errors
- Verify environment variables are set
- Check logs in Render dashboard

**Database issues:**
- SQLite file persists on Render's free tier
- For production, consider upgrading to paid tier

### Mobile Build Issues

**Build fails:**
- Check `eas build` logs
- Verify `app.json` is valid JSON
- Ensure bundle identifiers are unique

**App crashes:**
- Check API URL is correct
- Verify backend is running
- Check Expo logs

---

## 📞 Support

If you encounter issues:
1. Check Render logs: Dashboard → Logs
2. Check EAS build logs: `eas build:list`
3. Test API endpoints with Postman
4. Review app store rejection reasons carefully

---

## ✅ Next Steps After Deployment

1. **Monitor**: Check Render dashboard for uptime
2. **Analytics**: Consider adding analytics (Firebase, Amplitude)
3. **Feedback**: Set up user feedback mechanism
4. **Updates**: Plan regular updates based on user feedback
5. **Backup**: Regularly backup your database
6. **Domain**: Consider custom domain for professional look

---

**🎉 Congratulations!** You're ready to deploy your app to production!

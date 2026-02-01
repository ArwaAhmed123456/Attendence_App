# 🚀 Google Play Store Submission Guide

You have your `.aab` file! Now let's get it on the store.

## Step 1: Create Google Play Console Account ($25)
1. Go to [Google Play Console](https://play.google.com/console/signup)
2. Sign in with your Google Account
3. Accept the developer agreement
4. Pay the **$25 one-time registration fee**
5. Complete your account details verification

## Step 2: Create Your App Listing
1. In the console, click **"Create app"**
2. **App Name**: `Attendance Mobile App`
3. **Default Language**: English
4. **App or Game**: App
5. **Free or Paid**: Free
6. Accept the declarations and click **"Create app"**

## Step 3: Set Up Store Listing (Dashboard)
The dashboard will guide you through required tasks. You need to complete these sections:

### 1. Set up your app
- **Privacy Policy**: Enter `https://attendence-app-uzvt.onrender.com/privacy-policy.html`
- **App Access**: Select "All functionality is available without special access" (unless you have specific login restrictions, then provide test credentials)
- **Ads**: Select "No, my app does not contain ads"
- **Content Rating**: Click "Start questionnaire" and answer honestly (likely "Everyone" or "3+")
- **Target Audience**: Select "18 and over" to avoid extra requirements
- **News Apps**: Select "No"
- **COVID-19**: Select "My app is not a publicly available COVID-19 contact tracing or status app"
- **Data Safety**: Start questionnaire. Key points:
  - Does your app collect or share any of the required user data types? **Yes**
  - Is all user data collected encrypted in transit? **Yes**
  - key data to declare: Email, Name, Phone Number (for account management)

### 2. Store Listing Assets
Go to **"Main store listing"** and upload:
- **App Name**: `Attendance Mobile App`
- **Short Description**: `Professional attendance tracking for construction sites and projects`
- **Full Description**: (Copy from APP_STORE_ASSETS.md)
- **App Icon**: Upload `mobile/assets/icon.png` (You may need to resize to 512x512 if it's 1024x1024)
- **Feature Graphic**: You need a 1024x500 image (Use Canva to make a simple banner)
- **Screenshots**: Upload at least 2 screenshots

## Step 4: Upload Your AAB File
1. Go to **"Production"** in the left menu (under Release)
2. Click **"Create new release"**
3. Under "App bundles", click **"Upload"**
4. Select your downloaded `.aab` file
5. Wait for it to process
6. **Release Name**: It defaults to the version (e.g., 1.0.0)
7. **Release Notes**: "Initial release"
8. Click **"Next"**

## Step 5: Review and Rollout
1. You might see warnings (yellow) - usually okay to ignore for first release
2. Errors (red) must be fixed
3. Click **"Save"**
4. Click **"Go to publishing overview"**
5. Click **"Send 11 changes for review"** (number may vary)

## 🎉 Done!
Your app is now "In Review". This typically takes **1-3 days**. You will get an email when it's live!

---

### 💡 Pro Tips
- **Test Credentials**: If your app requires login (it does!), you MUST provide a test email/password in the **"App Access"** section. Create a dummy account like `demo@example.com` / `password123`.
- **Screenshots**: Don't use raw screenshots if possible. Use a tool like [MockuPhone](https://mockuphone.com) to put them in device frames - it looks much more professional.

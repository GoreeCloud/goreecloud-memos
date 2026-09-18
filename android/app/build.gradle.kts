plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.goreecloud.memos"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.goreecloud.memos"
        minSdk = 29
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0-dev.1"
        testInstrumentationRunner = "android.app.InstrumentationTestRunner"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".development"
            versionNameSuffix = "+android.1"
        }
        release {
            isMinifyEnabled = false
            signingConfig = null
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        buildConfig = true
    }
    lint {
        abortOnError = true
        checkReleaseBuilds = true
    }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}

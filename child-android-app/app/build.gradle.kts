import java.io.FileInputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt.android)
}

val buildDate = providers.provider {
    SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(Date())
}

android {
    namespace = "com.parental.child"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.parental.child"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        val localProps = Properties()
        val localPropsFile = rootProject.file("local.properties")
        if (localPropsFile.exists()) {
            FileInputStream(localPropsFile).use { stream ->
                localProps.load(stream)
            }
        }

        val devServerUrl = project.findProperty("SERVER_BASE_URL") as String?
            ?: localProps.getProperty("SERVER_BASE_URL")
            ?: System.getenv("SERVER_BASE_URL")
            ?: "https://unconfigured-dev-server.invalid"

        buildConfigField("String", "SERVER_BASE_URL", "\"$devServerUrl\"")

        buildConfigField("String", "ENVIRONMENT", "\"Development / Active Pairing\"")
        buildConfigField("String", "BUILD_DATE", "\"${buildDate.get()}\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "/META-INF/INDEX.LIST"
            excludes += "/META-INF/io.netty.versions.properties"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    debugImplementation(libs.compose.ui.tooling)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    implementation(libs.timber)
    implementation(libs.okhttp)
    implementation(libs.socket.io.client)
    implementation("com.google.android.gms:play-services-location:21.2.0")
}


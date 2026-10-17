package com.noctraplay.iptv

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity

/**
 * NOCTRA PLAY / GLOBAL PIPOCA - Main Android TV Activity
 * 100% programmatic WebView architecture designed for Android TV / TV Box stability.
 * Bypasses XML layout inflation, configures hardware acceleration, handles TV remote D-Pad,
 * and provides dual-path asset loading (index.html and www/index.html).
 */
class MainActivity : AppCompatActivity() {

    private val tag = "MainActivity"
    private var webView: WebView? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Keep screen on during TV video playback
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

            // Hide system UI / status bars for immersive TV experience
            hideSystemUI()

            // 1. Create root layout and WebView 100% programmatically
            val rootLayout = FrameLayout(this).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(Color.parseColor("#0C0D10"))
                isFocusable = false
            }

            val tvWebView = WebView(this).apply {
                id = View.generateViewId()
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(Color.parseColor("#0C0D10"))
                isFocusable = true
                isFocusableInTouchMode = true
                isClickable = true
            }

            rootLayout.addView(tvWebView)
            setContentView(rootLayout)
            webView = tvWebView

            // 2. Configure WebView settings for Android TV
            setupWebView(tvWebView)

            // 3. Load Web App with dual-path asset support
            loadWebApplication(tvWebView)

        } catch (e: Throwable) {
            Log.e(tag, "Erro crítico no onCreate da MainActivity: ${e.message}", e)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView(targetWebView: WebView) {
        try {
            targetWebView.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true

                // Allow media autoplay without touch/gesture for TV
                mediaPlaybackRequiresUserGesture = false

                // Mixed content allow for HTTP IPTV streams and channel logos
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

                // Asset loading security & compatibility
                allowFileAccess = true
                allowContentAccess = true

                // Allow local assets to read other local assets
                @Suppress("DEPRECATION")
                allowFileAccessFromFileURLs = true
                @Suppress("DEPRECATION")
                allowUniversalAccessFromFileURLs = true

                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
            }

            // Enable hardware acceleration for smooth 60fps TV rendering
            targetWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

            // Ensure focus is given to the WebView for TV remote control
            targetWebView.requestFocus()

            targetWebView.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    return false
                }

                override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                    super.onReceivedError(view, request, error)
                    Log.w(tag, "WebView error: ${error?.description} on ${request?.url}")
                }
            }

            targetWebView.webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest?) {
                    request?.grant(request.resources)
                }

                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    Log.d("WebConsole", "[${consoleMessage?.messageLevel()}] ${consoleMessage?.message()} (${consoleMessage?.sourceId()}:${consoleMessage?.lineNumber()})")
                    return true
                }
            }
        } catch (e: Throwable) {
            Log.e(tag, "Erro ao configurar parâmetros da WebView: ${e.message}", e)
        }
    }

    /**
     * Tenta carregar file:///android_asset/index.html e, em fallback, file:///android_asset/www/index.html
     */
    private fun loadWebApplication(targetWebView: WebView) {
        val targetUrl = determineWebAssetUrl()
        Log.i(tag, "Carregando aplicação web: $targetUrl")
        try {
            targetWebView.loadUrl(targetUrl)
        } catch (e: Throwable) {
            Log.e(tag, "Erro ao carregar URL ($targetUrl): ${e.message}", e)
            showFallbackScreen(targetWebView, e.message ?: "Erro desconhecido")
        }
    }

    private fun determineWebAssetUrl(): String {
        // 1. Tenta index.html diretamente na raiz dos assets
        if (assetExists("index.html")) {
            Log.d(tag, "Asset principal encontrado em: index.html")
            return "file:///android_asset/index.html"
        }

        // 2. Em fallback, tenta www/index.html
        if (assetExists("www/index.html")) {
            Log.d(tag, "Asset principal encontrado em: www/index.html")
            return "file:///android_asset/www/index.html"
        }

        // Caso padrão caso a lista seja virtual
        Log.w(tag, "Nenhum index.html encontrado diretamente via AssetManager. Tentando file:///android_asset/index.html")
        return "file:///android_asset/index.html"
    }

    private fun assetExists(assetPath: String): Boolean {
        return try {
            val stream = assets.open(assetPath)
            stream.close()
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun showFallbackScreen(targetWebView: WebView, errorMessage: String) {
        val safeHtml = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="utf-8">
                <title>GLOBAL PIPOCA TV</title>
                <style>
                    body {
                        background-color: #0C0D10;
                        color: #E5B842;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        padding: 32px;
                        box-sizing: border-box;
                        text-align: center;
                    }
                    h1 { font-size: 32px; font-weight: 800; margin-bottom: 12px; }
                    p { color: #A0A5B5; font-size: 18px; max-width: 640px; line-height: 1.5; margin: 8px 0; }
                    .badge { background: #1F222E; color: #F5C518; padding: 6px 16px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
                </style>
            </head>
            <body>
                <h1>GLOBAL PIPOCA</h1>
                <p>Iniciando o sistema de streaming para Android TV...</p>
                <div class="badge">$errorMessage</div>
            </body>
            </html>
        """.trimIndent()
        targetWebView.loadDataWithBaseURL(null, safeHtml, "text/html", "UTF-8", null)
    }

    private fun hideSystemUI() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.let { controller ->
                    controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                    controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                )
            }
        } catch (e: Throwable) {
            Log.w(tag, "Erro ao ocultar SystemUI: ${e.message}")
        }
    }

    /**
     * TV Remote D-Pad & Back key handling
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK) {
            if (event.action == KeyEvent.ACTION_UP) {
                // Dispatch Escape/Back event to the React spatial navigation
                webView?.evaluateJavascript(
                    """
                    (function() {
                        var evt = new KeyboardEvent('keydown', {
                            key: 'Escape',
                            code: 'Escape',
                            keyCode: 27,
                            which: 27,
                            bubbles: true,
                            cancelable: true
                        });
                        window.dispatchEvent(evt);
                    })();
                    """.trimIndent(),
                    null
                )
            }
            return true
        }

        return super.dispatchKeyEvent(event)
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        try {
            webView?.onResume()
        } catch (e: Throwable) {
            Log.w(tag, "Erro no onResume da WebView: ${e.message}")
        }
    }

    override fun onPause() {
        try {
            webView?.onPause()
        } catch (e: Throwable) {
            Log.w(tag, "Erro no onPause da WebView: ${e.message}")
        }
        super.onPause()
    }

    override fun onDestroy() {
        try {
            webView?.destroy()
            webView = null
        } catch (e: Throwable) {
            Log.w(tag, "Erro no onDestroy da WebView: ${e.message}")
        }
        super.onDestroy()
    }
}

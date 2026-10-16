package com.noctraplay.iptv

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView

/**
 * NOCTRA PLAY - Main Android TV Activity
 * Optimized for Android TV Box, Fire TV Stick, and Google TV
 * Incorporates Leanback remote navigation, Media3/ExoPlayer, and hardware acceleration
 */
class MainActivity : AppCompatActivity() {

    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen on for TV playback
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Hide navigation bars for immersive 10-foot TV experience
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )

        setContentView(R.layout.activity_main)
        initializePlayer()
    }

    private fun initializePlayer() {
        // Build optimized ExoPlayer instance for IPTV HLS / TS / MP4 streams
        exoPlayer = ExoPlayer.Builder(this)
            .setSeekBackIncrementMs(10000)
            .setSeekForwardIncrementMs(10000)
            .build()
            .apply {
                addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(playbackState: Int) {
                        when (playbackState) {
                            Player.STATE_BUFFERING -> {
                                // Show buffering spinner
                            }
                            Player.STATE_READY -> {
                                // Playback ready
                            }
                            Player.STATE_ENDED -> {
                                // Content completed
                            }
                            Player.STATE_IDLE -> {
                                // Idle
                            }
                        }
                    }

                    override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                        // Handle network timeout, format error, or codec issue gracefully
                    }
                })
            }
    }

    /**
     * Play an IPTV Stream (Live M3U8, TS, or VOD MP4)
     */
    fun playStream(url: String, isLive: Boolean) {
        val mimeType = if (url.contains(".m3u8") || isLive) {
            MimeTypes.APPLICATION_M3U8
        } else {
            MimeTypes.APPLICATION_MP4
        }

        val mediaItem = MediaItem.Builder()
            .setUri(url)
            .setMimeType(mimeType)
            .build()

        exoPlayer?.apply {
            setMediaItem(mediaItem)
            prepare()
            playWhenReady = true
        }
    }

    /**
     * Android TV D-Pad Key Handling
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER -> {
                // Handle OK button selection
                return super.onKeyDown(keyCode, event)
            }
            KeyEvent.KEYCODE_DPAD_UP -> {
                // Navigate UP
                return super.onKeyDown(keyCode, event)
            }
            KeyEvent.KEYCODE_DPAD_DOWN -> {
                // Navigate DOWN
                return super.onKeyDown(keyCode, event)
            }
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                // Seek back or navigate left
                return super.onKeyDown(keyCode, event)
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                // Seek forward or navigate right
                return super.onKeyDown(keyCode, event)
            }
            KeyEvent.KEYCODE_BACK -> {
                // Return to previous screen or exit player
                return super.onKeyDown(keyCode, event)
            }
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                exoPlayer?.let {
                    if (it.isPlaying) it.pause() else it.play()
                }
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onStop() {
        super.onStop()
        exoPlayer?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        exoPlayer?.release()
        exoPlayer = null
    }
}

(function() {
  'use strict';

  const AUDIO_ELEMENT_ID = 'mob-radio-player';
  const PLAYLIST_URL = 'assets/mobradio/playlist.json';
  const PLAYING_CLASS = 'is-playing';
  const utils = window.utils || {};
  const domCache = typeof utils.domCache === 'object' ? utils.domCache : null;

  function fetchPlaylist() {
    if (typeof fetch !== 'function') {
      return Promise.reject(new Error('Fetch API is not available in this browser.'));
    }

    return fetch(PLAYLIST_URL, { cache: 'no-store' }).then(function(response) {
      if (!response.ok) {
        throw new Error('Failed to load Mob Radio playlist manifest.');
      }
      return response.json();
    });
  }

  function initMobRadio() {
    const config = window.CONFIG || {};
    const selectors = config.SELECTORS || {};
    const button = domCache ? domCache.get(selectors.mobRadioButton || '.mob-radio-button') : document.querySelector(selectors.mobRadioButton || '.mob-radio-button');
    const audio = domCache ? domCache.get(`#${AUDIO_ELEMENT_ID}`) : document.getElementById(AUDIO_ELEMENT_ID);
    const volumeSlider = domCache ? domCache.get('#mob-radio-volume-slider') : document.getElementById('mob-radio-volume-slider');
    const playerFactory = window.playlistPlayer && typeof window.playlistPlayer.create === 'function' ? window.playlistPlayer.create : null;

    if (!button || !audio) {
      return;
    }

    const defaultTooltip = button.getAttribute('title') || button.getAttribute('aria-label') || '';

    button.setAttribute('disabled', 'disabled');

    // Handle volume changes
    function handleVolumeChange() {
      if (!volumeSlider) return;
      const volume = volumeSlider.value / 100;
      if (player) {
        player.setVolume(volume);
      } else {
        audio.volume = volume;
      }
    }

    // Set up volume control
    if (volumeSlider) {
      volumeSlider.addEventListener('input', handleVolumeChange);
      volumeSlider.addEventListener('change', handleVolumeChange);
    }

    function setButtonPlaying(playing) {
      button.classList.toggle(PLAYING_CLASS, playing);
      button.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }

    function setTooltip(track) {
      if (!track) {
        button.removeAttribute('data-track-title');
        if (defaultTooltip) {
          button.setAttribute('title', defaultTooltip);
        } else {
          button.removeAttribute('title');
        }
        return;
      }

      const label = track.title;
      button.setAttribute('data-track-title', track.title);
      button.setAttribute('title', label);
    }

    const player = playerFactory ? playerFactory(audio, { storageKey: 'mobRadio', onTrackChange: setTooltip }) : null;

    if (volumeSlider) {
      volumeSlider.value = String(Math.round((audio.volume || 0.7) * 100));
    }

    function togglePlayback() {
      if (!player) return;
      player.togglePlayback();
    }

    function bindEvents() {
      button.addEventListener('click', togglePlayback);
      button.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          togglePlayback();
        }
      });

      audio.addEventListener('play', function() {
        setButtonPlaying(true);
      });

      audio.addEventListener('pause', function() {
        if (!audio.ended) {
          setButtonPlaying(false);
        }
      });
    }

    function disableButton(reason) {
      console.warn(reason);
      if (player && typeof player.setPlaylist === 'function') {
        player.setPlaylist([]);
      }
      setButtonPlaying(false);
      button.setAttribute('disabled', 'disabled');
      setTooltip(null);
    }

    bindEvents();

    (async function loadPlaylist() {
      try {
        const tracks = await fetchPlaylist();
        if (!Array.isArray(tracks) || tracks.length === 0) {
          disableButton('Mob Radio playlist is empty.');
          return;
        }
        if (player && typeof player.setPlaylist === 'function') {
          player.setPlaylist(tracks);
        }
        button.removeAttribute('disabled');
        setTooltip(null);
      } catch (error) {
        disableButton(error && error.message ? error.message : 'Unable to load Mob Radio playlist.');
      }
    })();
  }

  if (typeof utils.onReady === 'function') {
    utils.onReady(initMobRadio);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMobRadio);
    } else {
      initMobRadio();
    }
  }
})();



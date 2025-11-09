(function() {
  'use strict';

  const AUDIO_ELEMENT_ID = 'mob-radio-player';
  const PLAYLIST_URL = 'assets/mobradio/playlist.json';
  const PLAYING_CLASS = 'is-playing';

  function shuffle(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function encodeTrackSrc(track) {
    return encodeURI(track.file);
  }

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
    const button = document.querySelector(selectors.mobRadioButton || '.mob-radio-button');
    const audio = document.getElementById(AUDIO_ELEMENT_ID);

    if (!button || !audio) {
      return;
    }

    const defaultTooltip = button.getAttribute('title') || button.getAttribute('aria-label') || '';

    const state = {
      playlist: [],
      queue: [],
      index: -1
    };

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

    function prepareQueue() {
      if (!state.playlist.length) {
        state.queue = [];
        state.index = -1;
        return;
      }
      state.queue = shuffle(state.playlist);
      state.index = 0;
    }

    function currentTrack() {
      return state.queue[state.index];
    }

    function loadCurrentTrack() {
      const track = currentTrack();
      if (!track) {
        setTooltip(null);
        setButtonPlaying(false);
        audio.removeAttribute('src');
        return;
      }

      audio.src = encodeTrackSrc(track);
      setTooltip(track);
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function(error) {
          console.error('Mob Radio playback failed to start:', error);
          setButtonPlaying(false);
        });
      }
    }

    function playNextTrack() {
      if (!state.queue.length) {
        prepareQueue();
      } else {
        state.index += 1;
        if (state.index >= state.queue.length) {
          prepareQueue();
        }
      }
      loadCurrentTrack();
    }

    function togglePlayback() {
      if (!state.playlist.length) {
        console.warn('Mob Radio playlist is not ready yet.');
        return;
      }

      if (audio.paused) {
        if (!state.queue.length || state.index === -1 || audio.ended || !audio.src) {
          prepareQueue();
          loadCurrentTrack();
        } else {
          const playPromise = audio.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function(error) {
              console.error('Mob Radio resume failed:', error);
              setButtonPlaying(false);
            });
          }
        }
      } else {
        audio.pause();
      }
    }

    function bindEvents() {
      button.addEventListener('click', togglePlayback);
      button.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          togglePlayback();
        }
      });

      audio.addEventListener('ended', function() {
        playNextTrack();
      });

      audio.addEventListener('error', function(event) {
        console.error('Mob Radio encountered an audio error:', event);
        playNextTrack();
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
      setButtonPlaying(false);
      button.setAttribute('disabled', 'disabled');
      setTooltip(null);
    }

    bindEvents();

    fetchPlaylist()
      .then(function(tracks) {
        if (!Array.isArray(tracks) || !tracks.length) {
          disableButton('Mob Radio playlist is empty.');
          return;
        }
        state.playlist = tracks.slice();
        button.removeAttribute('disabled');
        setTooltip(null);
      })
      .catch(function(error) {
        disableButton(error && error.message ? error.message : 'Unable to load Mob Radio playlist.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobRadio);
  } else {
    initMobRadio();
  }
})();



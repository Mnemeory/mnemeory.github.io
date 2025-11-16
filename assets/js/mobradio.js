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

  function createPlayer(audioElement) {
    const state = {
      playlist: [],
      queue: [],
      index: -1
    };

    function loadVolume() {
      try {
        const saved = localStorage.getItem('mobRadio:volume');
        const volume = saved !== null ? parseFloat(saved) : 0.7;
        if (Number.isFinite(volume)) {
          audioElement.volume = Math.min(1, Math.max(0, volume));
        }
      } catch (_) {}
    }
    function saveVolume() {
      try {
        localStorage.setItem('mobRadio:volume', String(audioElement.volume));
      } catch (_) {}
    }
    function setVolume(volume) {
      const v = Math.min(1, Math.max(0, Number(volume)));
      if (Number.isFinite(v)) {
        audioElement.volume = v;
        saveVolume();
      }
    }
    function setQueue() {
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
    function loadCurrentTrack(onTrackChange) {
      const track = currentTrack();
      if (!track) {
        audioElement.removeAttribute('src');
        return;
      }
      audioElement.src = encodeURI(track.file);
      if (typeof onTrackChange === 'function') {
        onTrackChange(track);
      }
      const playPromise = audioElement.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function() {});
      }
    }
    function playNext(onTrackChange) {
      if (!state.queue.length) {
        setQueue();
      } else {
        state.index += 1;
        if (state.index >= state.queue.length) {
          setQueue();
        }
      }
      loadCurrentTrack(onTrackChange);
    }
    function togglePlayback(onTrackChange) {
      if (!state.playlist.length) return;
      if (audioElement.paused) {
        if (!state.queue.length || state.index === -1 || audioElement.ended || !audioElement.src) {
          setQueue();
          loadCurrentTrack(onTrackChange);
        } else {
          const playPromise = audioElement.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function() {});
          }
        }
      } else {
        audioElement.pause();
      }
    }
    function setPlaylist(tracks) {
      if (!Array.isArray(tracks)) {
        state.playlist = [];
        state.queue = [];
        state.index = -1;
        return;
      }
      state.playlist = tracks.slice();
      state.queue = [];
      state.index = -1;
    }

    audioElement.addEventListener('ended', () => playNext());
    audioElement.addEventListener('error', () => playNext());
    loadVolume();

    return {
      setPlaylist,
      togglePlayback,
      setVolume
    };
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

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function initMobRadio() {
    const button = document.querySelector('.mob-radio-button');
    const audio = document.getElementById(AUDIO_ELEMENT_ID);
    const volumeSlider = document.getElementById('mob-radio-volume-slider');
    if (!button || !audio) return;

    const player = createPlayer(audio);
    const defaultTooltip = button.getAttribute('title') || button.getAttribute('aria-label') || '';

    button.setAttribute('disabled', 'disabled');
    if (volumeSlider) {
      volumeSlider.value = String(Math.round((audio.volume || 0.7) * 100));
      const handleVolumeChange = () => {
        const volume = volumeSlider.value / 100;
        player.setVolume(volume);
      };
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
    function togglePlayback() {
      player.togglePlayback(setTooltip);
    }

    button.addEventListener('click', togglePlayback);
    button.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        togglePlayback();
      }
    });
    audio.addEventListener('play', function() { setButtonPlaying(true); });
    audio.addEventListener('pause', function() { if (!audio.ended) setButtonPlaying(false); });

    (async function loadPlaylist() {
      try {
        const tracks = await fetchPlaylist();
        if (!Array.isArray(tracks) || tracks.length === 0) {
          console.warn('Mob Radio playlist is empty.');
          button.setAttribute('disabled', 'disabled');
          setButtonPlaying(false);
          setTooltip(null);
          return;
        }
        player.setPlaylist(tracks);
        button.removeAttribute('disabled');
        setTooltip(null);
      } catch (error) {
        console.warn(error && error.message ? error.message : 'Unable to load Mob Radio playlist.');
        button.setAttribute('disabled', 'disabled');
        setButtonPlaying(false);
        setTooltip(null);
      }
    })();
  }

  onReady(initMobRadio);
})();


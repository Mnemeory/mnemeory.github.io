// Playlist Player Utility
//
// A small reusable audio playlist controller with shuffle, queue management,
// and localStorage persistence for volume and last track metadata.
//
// Usage:
//   const player = window.playlistPlayer.create(audioEl, {
//     storageKey: 'mobRadio',
//     onTrackChange: (track) => { /* update UI */ }
//   });
//   player.setPlaylist(tracks);
//   player.togglePlayback();
//
(function() {
  'use strict';

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

  function create(audioElement, options = {}) {
    if (!audioElement) {
      throw new Error('playlistPlayer.create requires a valid audio element.');
    }

    const opts = {
      storageKey: typeof options.storageKey === 'string' ? options.storageKey : 'playlist',
      onTrackChange: typeof options.onTrackChange === 'function' ? options.onTrackChange : null
    };

    const state = {
      playlist: [],
      queue: [],
      index: -1
    };

    function getStorageKey(suffix) {
      return opts.storageKey + ':' + suffix;
    }

    function loadVolume() {
      const saved = localStorage.getItem(getStorageKey('volume'));
      const volume = saved !== null ? parseFloat(saved) : 0.7;
      if (Number.isFinite(volume)) {
        audioElement.volume = Math.min(1, Math.max(0, volume));
      }
    }

    function saveVolume() {
      try {
        localStorage.setItem(getStorageKey('volume'), String(audioElement.volume));
      } catch (_) {
        // ignore
      }
    }

    function setVolume(volume) {
      const v = Math.min(1, Math.max(0, Number(volume)));
      if (Number.isFinite(v)) {
        audioElement.volume = v;
        saveVolume();
      }
    }

    function encodeTrackSrc(track) {
      return encodeURI(track.file);
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

    function loadCurrentTrack() {
      const track = currentTrack();
      if (!track) {
        audioElement.removeAttribute('src');
        return;
      }
      audioElement.src = encodeTrackSrc(track);
      if (opts.onTrackChange) {
        opts.onTrackChange(track);
      }
      const playPromise = audioElement.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function() {
          // Autoplay likely blocked; UI should reflect paused state externally
        });
      }
    }

    function playNext() {
      if (!state.queue.length) {
        setQueue();
      } else {
        state.index += 1;
        if (state.index >= state.queue.length) {
          setQueue();
        }
      }
      loadCurrentTrack();
    }

    function playPrev() {
      if (!state.queue.length) {
        setQueue();
      } else {
        state.index -= 1;
        if (state.index < 0) {
          state.index = state.queue.length - 1;
        }
      }
      loadCurrentTrack();
    }

    function togglePlayback() {
      if (!state.playlist.length) {
        return;
      }
      if (audioElement.paused) {
        if (!state.queue.length || state.index === -1 || audioElement.ended || !audioElement.src) {
          setQueue();
          loadCurrentTrack();
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

    function getState() {
      return {
        playlistLength: state.playlist.length,
        queueLength: state.queue.length,
        index: state.index
      };
    }

    // Wire audio events
    audioElement.addEventListener('ended', playNext);
    audioElement.addEventListener('error', playNext);

    // Initialize volume from storage
    loadVolume();

    return Object.freeze({
      setPlaylist,
      togglePlayback,
      playNext,
      playPrev,
      setVolume,
      getState
    });
  }

  window.playlistPlayer = Object.freeze({
    create
  });
})();



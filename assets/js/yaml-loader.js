// YAML Loader Utilities
//
// Provides shared helpers for fetching YAML and loading resource definitions.
// Exposes window.yamlLoader with:
// - fetchYAML(path)
// - getFileName(path)
// - loadResources(resourceDefinitions) -> Promise<allSettled-like array>
//
(function() {
  'use strict';

  function getFileName(path) {
    if (typeof path !== 'string') {
      return '';
    }
    const segments = path.split('/');
    return segments[segments.length - 1];
  }

  async function fetchYAML(path) {
    const config = window.CONFIG || {};
    const displayText = (config && config.DISPLAY_TEXT) || {};
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: HTTP ${response.status}`);
      }
      const text = await response.text();

      try {
        return jsyaml.load(text);
      } catch (yamlError) {
        throw new Error(`Invalid YAML syntax in ${path}: ${yamlError.message}`);
      }
    } catch (error) {
      if (typeof jsyaml === 'undefined' || typeof jsyaml.load !== 'function') {
        throw new Error(displayText.errors?.yamlUnavailable || 'YAML parser is not available.');
      }
      throw error;
    }
  }

  function loadResources(resourceDefinitions) {
    if (!Array.isArray(resourceDefinitions)) {
      return Promise.resolve([]);
    }
    return Promise.allSettled(
      resourceDefinitions.map(resource => {
        if (!resource || !resource.path) {
          return Promise.reject(new Error(`Missing data path for ${resource && resource.key ? resource.key : 'unknown'}`));
        }
        return fetchYAML(resource.path);
      })
    );
  }

  window.yamlLoader = Object.freeze({
    getFileName,
    fetchYAML,
    loadResources
  });
})();



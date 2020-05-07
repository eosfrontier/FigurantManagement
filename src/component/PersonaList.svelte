<script>
  import Icon from 'fa-svelte'
  import { faList } from '@fortawesome/free-solid-svg-icons/faList'
</script>

<style>
  .openList {
    position: absolute;
    block-size: clamp(4.5rem, 6.25rem, 10vh);
    inline-size: clamp(4.5rem, 6.25rem, 10vh);
    top: 0;
    right: 0;
    font-size: 1.75em;

    border: none;
    color: #ccd1dd;
    background: none;
    z-index: 1;
  }
  .openList::before {
    position: absolute;
    content: '';
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: radial-gradient(
      circle at center,
      #2c3445 0.98em,
      transparent 1em,
      transparent 100%
    );
    z-index: -1;
    transition: opacity 0.17s;
    opacity: 0;
  }
  .openList:active::before {
    opacity: 1;
  }
  .openList:active {
    background: none;
  }
</style>

<button class="openList">
  <Icon class="faIcon" icon={faList} />
</button>

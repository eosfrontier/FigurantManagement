<style>
  button {
    border-radius: 5px;
    top: clamp(1.25em, 2em, calc(5% - 1.75rem));
    right: 10%;

    position: absolute;
    cursor: pointer;
    color: #fff;
    background: #386ae8;
    border: 1px solid #4975e3;
    font-size: 1rem;

    transition: 0.2s;
    padding: 0;
    padding: 0.5rem;
    margin-bottom: -1rem;
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
      0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
    text-shadow: 0 3px 1px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14),
      0 1px 5px rgba(0, 0, 0, 0.12);
  }
  button:hover,
  button:focus {
    background: #4975e3;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
      0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 5px rgba(0, 0, 0, 0.14),
      0 1px 10px rgba(0, 0, 0, 0.12);
  }
  button:active {
    background: #507ef2;
    border-color: #507ef2;
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
      0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
    text-shadow: 0 5px 5px rgba(0, 0, 0, 0.2), 0 8px 10px rgba(0, 0, 0, 0.14),
      0 3px 14px rgba(0, 0, 0, 0.12);
  }
  button:before {
    content: 'Generate ';
    text-shadow: 1px 1px 4px rgba(38, 46, 62, 0.6);
  }
  button:after {
    content: '🎲';
  }
  button:active:after {
    display: inline-block;
    content: '🎲';
    transform: rotate(-360deg);
    transition: 0.3s;
  }
  /* Tablet size or smaller */
  @media screen and (max-width: 76em) {
    button {
      border-radius: 50%;
      top: clamp(1.25em, 2em, calc(10% - 1.75rem));
      width: 3.5rem;
      height: 3.5rem;
      font-size: 2rem;
      padding: 0rem;
      margin-bottom: 0rem;
      box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2),
        0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
    }
    button:hover,
    button:focus {
      box-shadow: 0 5px 6px -3px rgba(0, 0, 0, 0.2),
        0 9px 12px 1px rgba(0, 0, 0, 0.14), 0 3px 16px 2px rgba(0, 0, 0, 0.12);
    }
    button:active {
      box-shadow: 0 7px 8px -4px rgba(0, 0, 0, 0.2),
        0 12px 17px 2px rgba(0, 0, 0, 0.14), 0 5px 22px 4px rgba(0, 0, 0, 0.12);
    }
    button:before {
      content: '';
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 47em) {
    button {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1.25em;
      top: unset;
      bottom: calc(15% - 2.5rem);
    }
  }
</style>

<button />

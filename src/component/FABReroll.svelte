<style>
  button {
    border-radius: 5px;
    top: 5%;
    right: 10%;

    position: absolute;
    cursor: pointer;
    color: #4975e3;
    background: none;
    border: 1px solid #4975e3;
    font-size: 1rem;

    transition: 0.2s;
    padding: 0;
    padding: 0.5rem;
    margin-bottom: -1rem;
  }
  button:hover,
  button:focus {
    color: #fff;
    background: #386ae8;
  }
  button:not(:disabled):active {
    background: #507ef2;
    border-color: #507ef2;
  }
  button:disabled {
    color: #ccd1dd;
    background: #3b414e;
    border-color: #ccd1dd;
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
      background: #386ae8;
      border-radius: 50%;
      top: 10%;
      width: 3.5rem;
      height: 3.5rem;
      font-size: 2rem;
      padding: 0rem;
      margin-bottom: 0rem;
      box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2),
        0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
    }
    button:not(:disabled):active {
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
      top: 85%;
    }
  }
</style>

<button />

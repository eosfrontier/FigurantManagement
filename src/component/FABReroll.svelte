<style>
  button {
    border-radius: 5px;
    top: 5%;
    right: 10%;

    position: absolute;
    color: #fff;
    background: #31e184;
    font-size: 1rem;
    box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14),
      0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.2);
    border: 0px;
    transition: 0.2s;
    padding: 0;
    padding: 0.5rem;
    margin-bottom: -1rem;
  }
  button:active {
    box-shadow: 0 12px 17px 2px rgba(0, 0, 0, 0.14),
      0 5px 22px 4px rgba(0, 0, 0, 0.12), 0 7px 8px -4px rgba(0, 0, 0, 0.2);
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
  @media screen and (max-width: 1215px) {
    button {
      border-radius: 50%;
      top: 10%;
      width: 3.5rem;
      height: 3.5rem;
      font-size: 2rem;
      padding: 0rem;
      margin-bottom: 0rem;
    }
    button:before {
      content: '';
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 753px) {
    button {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1.25em;
      top: 85%;
    }
  }
</style>

<button />

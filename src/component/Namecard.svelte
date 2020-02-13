<script>
  export let name
</script>

<style>
  section {
    background-color: #2c3445;
    font-weight: normal;
    color: #ccd1dd;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    padding: 1rem;
    margin: 0.4rem;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
    background-repeat: no-repeat;
    background-position: right bottom;
    background-size: 33%;
  }
  input[type='text'] {
    width: auto;
    background: none;
    border: 0;
    border-bottom: 2px solid #838795;
    color: #ccd1dd;
    padding: 0.3rem 0.5rem;
    transition: 0.3s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 95%;
  }
  input[type='text']:hover,
  input[type='text']:active,
  input[type='text']:focus {
    border: 0;
    color: #fff;
    border-bottom: 2px solid #507ef2;
  }
  input[type='submit'] {
    cursor: pointer;
    color: #507ef2;
    background: rgba(44, 52, 69, 0.8);
    border: 1px solid #4975e3;
    border-radius: 5px;
    padding: 0.5rem;
    transition: 0.4s;
    margin-bottom: -1rem;
    text-shadow: 1px 1px 4px rgba(38, 46, 62, 0.6);
  }
  input[type='submit']:hover,
  input[type='submit']:focus,
  input[type='submit']:active {
    background: #507ef2;
    border-color: #507ef2;
    color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  }
</style>

<section>
  <form>
    <input type="submit" />
    <!--the submit button must become its own component, so that the button holds the logic for the exporting -->
    <input type="text" value={name} />
  </form>
</section>

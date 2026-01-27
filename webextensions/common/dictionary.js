import Base from './base.js';
// We will import TextTransform later, or pass it as dependency. 
// Circular dependency might occur if we are not careful.
// Dictionary uses TextTransform for input validation.
// For now, let's assume it is passed or we import it.
//import TextTransform from './text-transform.js';

class Dictionary extends Base {
  constructor() {
    super();
    this.lang = '';
    this.initialized = false;
    this.list = {};
  }

  async load(aOptions = {}) {
    if (!this.lang) return false;

    this.list = {};

    // Using fetch to load dictionaries.
    // Dictionaries are expected to be under /dictionaries/{lang}/

    const dicPath = aOptions.dicPath || `/dictionaries/${this.lang}/`;

    let error = false;

    try {
      const response = await fetch(dicPath + this.lang + '.txt');
      if (response.ok) {
        this.list['system'] = await response.text();
      }
      else {
        this.list['system'] = '';
        error = true;
      }
    }
    catch(e) {
      console.error('Dictionary: Failed to load system dictionary', e);
      this.list['system'] = '';
      error = true;
    }

    // User dictionary - omitting file access. 
    // We might implement IDB based user dic later if needed.
    this.list['user'] = '';

    this.initialized = true;
    return !error;
  }

  reload() {
    return this.load();
  }

  /*
  saveUserDic() {
    // Not implemented in WE yet
  }

  addTerm(aInput, aTerm) {
    // Omitted
    return this.RESULT_ERROR_NOT_IMPLEMENTED;
  }

  removeTerm(aInput, aTerm) {
    // Omitted
    return this.RESULT_ERROR_NOT_IMPLEMENTED;
  }
  */

  getDic() {
    return this.list['system'];
  }

  getUserDic() {
    return this.list['user'];
  }

  /*
  modifyDic(aTermSet, aOperation) {
    // Omitted
    return this.RESULT_ERROR_NOT_IMPLEMENTED;
  }
  */
}

export default Dictionary;

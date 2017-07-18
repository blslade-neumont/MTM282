

(function() {
    function createRegexValidator(input, name) {
        if (!name) name = 'regex';
        let regexStr = input.getAttribute(`data-${name}`);
        if (regexStr) {
            let desc = input.getAttribute(`data-${name}-desc`) || `Must match the regex: ${regexStr}`;
            let regex = new RegExp(regexStr, 'i');
            return {
                predicate: value => regex.test(value),
                desc
            };
        }
        return null;
    }
    function createMatchValidator(input, name) {
        if (!name) name = 'match';
        let matchStr = input.getAttribute(`data-${name}`);
        if (matchStr) {
            let desc = input.getAttribute(`data-${name}-desc`) || `Must match the value from the ${matchStr} field`;
            let elem = input.form.elements[matchStr];
            if (!elem) throw new Error(`Could not find element with name ${matchStr}`);
            return {
                predicate: value => value === elem.value,
                desc
            };
        }
        return null;
    }
    
    function init() {
        let form = document.forms[0];
        let inputs = form.elements;
        for (let q = 0; q < inputs.length; q++) {
            let input = inputs[q];
            let validators = [];
            
            let regexValidator = createRegexValidator(input);
            if (regexValidator) validators.push(regexValidator);
            
            let regexCount = +(input.getAttribute('data-regex-c') || '0');
            for (let w = 0; w < regexCount; w++) {
                let regexnValidator = createRegexValidator(input, `regex-${w}`);
                if (regexnValidator) validators.push(regexnValidator);
            }
            
            let matchValidator = createMatchValidator(input);
            if (matchValidator) validators.push(matchValidator);
            
            input.addEventListener('blur', () => {
                if (input.getAttribute('data-toupper')) input.value = ('' + input.value).toUpperCase();
                input.classList.add('dirty');
            });
            input.addEventListener('change', () => {
                input.classList.remove('valid', 'invalid');
                let isValid = !validators.some(validator => !validator.predicate(input.value));
                input.classList.add(isValid ? 'valid' : 'invalid');
            });
            input.validators = validators;
        }
        
        form.addEventListener('submit', e => {
            let isValid = true;
            for (let q = 0; q < inputs.length; q++) {
                let input = inputs[q];
                input.classList.add('dirty');
                let validators = input.validators || [];
                for (let w = 0; w < validators.length; w++) {
                    let validator = validators[w];
                    if (!validator.predicate(input.value)) {
                        console.log(validator.desc);
                        isValid = false;
                        input.classList.add('invalid');
                    }
                }
            }
            if (!isValid) e.preventDefault();
        });
    }

    switch (document.readyState) {
    case 'complete':
    case 'interactive':
        init();
        break;
    default:
        document.addEventListener('DOMContentLoaded', init);
    }
})();

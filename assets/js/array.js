//const fileList = Array.from({ length: 14 }, (_, i) => `assets/data/${2024 - i}.json`);
const fileList = [`assets/data/2024.json`];

async function fetchData(inputData) {
  try {
    const response = await fetch(inputData);
    if (!response.ok) {
      throw new Error(`Hálózati vagy fájl betöltési hiba: ${response.statusText}`);
    }
    return await response.json()
  } catch (error) {
    console.log('Hiba történt a fájl betöltése közben:', error);
    throw error
  }
}

function extractItemsFromData(data, callback) {
  function findItems(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(item => findItems(item));
    } else if (typeof obj === 'object') {
      if (obj.itemList) {
        obj.itemList.forEach(subObj => {
          if (subObj.itemListElement && subObj.itemListElement.length >= 7) {
            callback(subObj.itemListElement[6]);
          }
        });
      }
      Object.values(obj).forEach(value => findItems(value));
    }
  }
  findItems(data);
}

function extractSeventhNumbers(data) {
  const sixthItems = [];
  extractItemsFromData(data, seventhItem => {
    sixthItems.push(seventhItem);
  });
  return sixthItems;
}

function extractFirstThreeDigits(data) {
  const firstThreeDigitsList = [];
  extractItemsFromData(data, seventhItem => {
    if (seventhItem.numbers) {
      const numbers = seventhItem.numbers.split(' ');
      if (numbers.length >= 3) {
        firstThreeDigitsList.push(numbers.slice(0, 2));
      }
    }
  });
  return firstThreeDigitsList;
}

function extractLastThreeDigits(data) {
  const lastThreeDigitsList = [];
  extractItemsFromData(data, seventhItem => {
    if (seventhItem.numbers) {
      const numbers = seventhItem.numbers.split(' ');
      if (numbers.length >= 3) {
        lastThreeDigitsList.push(numbers.slice(-2));
      }
    }
  });
  return lastThreeDigitsList;
}

async function processRawData(filePaths) { // extractSeventhNumbers extractLastThreeDigits függvényekhez
  try {
    const jsonData = await fetchData(filePaths); //console.log('Betöltött JSON adatok:', jsonData);
    const firstThreeDigits = extractFirstThreeDigits(jsonData); // Keresés az első két numbers mezőkért
    const lastThreeDigits = extractLastThreeDigits(jsonData);   // Keresés az utolsó két numbers mezőkért
    return {
      firstThreeDigits, // Visszaadjuk a feldolgozott adatokat
      lastThreeDigits   // Visszaadjuk a feldolgozott adatokat
    };
  } catch (error) {
    console.error('Hiba történt az adatok feldolgozása közben:', error);
    return {
      firstThreeDigits: [], // Visszaadunk üres tömböket hiba esetén
      lastThreeDigits: []   // Visszaadunk üres tömböket hiba esetén
    };
  }
}

function appendNumbersToList(numbers, listElement) {
  numbers.forEach(number => {
    if (Array.isArray(number)) {
      // Ha a number egy tömb, minden elemet külön sorba teszünk
      number.forEach(singleNumber => {
        const listItem = document.createElement('li');
        listItem.textContent = singleNumber; // Egy szám egy sor
        listElement.appendChild(listItem);
      });
    } else {
      // Ha nem tömb, egyszerűen hozzáadjuk
      const listItem = document.createElement('li');
      listItem.textContent = number;
      listElement.appendChild(listItem);
    }
  });
}

async function loadAndProcessData() {
  const filePaths = fileList;
  try {
    // Minden fájl betöltése és feldolgozása
    const dataPromises = filePaths.map(filePath => processRawData(filePath));
    const results = await Promise.all(dataPromises);
  } catch (error) {
    console.error('Hiba történt az adatok betöltése közben:', error);
  }
}

loadAndProcessData();

async function loadData() {
  const urls = fileList
  const dataPromises = urls.map(url => fetchData(url));
  try {
    const dataArray = await Promise.all(dataPromises);
    //console.log('Betöltött adatok:', dataArray); // Ellenőrizze az adatokat
    const indices = [0, 1, 2, 3, 4, 5, 7, 8]; // A kezelni kívánt indexek
    const combinedNumbers = {}; // Objektum, ami a kombinált számokat fogja tartalmazni
    // Hívja meg a processFirstAndLastTwoOfSixthData függvényt
    // Minden indexhez egy üres tömb létrehozása a combinedNumbers objektumban
    indices.forEach(index => {
      combinedNumbers[index] = [];
    });
    // Az összes adat bejárása és az indexekhez tartozó számok összegyűjtése
    dataArray.forEach(data => {
      indices.forEach(index => {
        const numAr = getNumbersByIndex(data, index);
        combinedNumbers[index] = combinedNumbers[index].concat(numAr);
      });
    });
    // Az adatok megjelenítése minden indexhez
    indices.forEach(index => {
      displayNumber(combinedNumbers[index], `jsonData${index}`);
    });
  } catch (error) {
    console.error('Hiba történt az adatok betöltése közben:', error);
  }
}

function getNumbersByIndex(data, index) {
  const numbersTomb = [];
  data.itemList.forEach(dateItem => {
    const prizeItem = dateItem.itemListElement[index];
    if (dateItem.itemListElement && dateItem.itemListElement[index]) {
      const prizeItem = dateItem.itemListElement[index];
      prizeItem?.numbers && numbersTomb.push(...prizeItem.numbers.split(' '));
    }
  });
  return numbersTomb//.sort((a, b) => a - b); // Számokat numerikusan rendezzük
}

function displayNumber(numAr, ulElementId) {
  const ulElement = document.getElementById(ulElementId);
  if (!ulElement) {
    return;
  }
  ulElement.innerHTML = ''; // Előző elemek törlése, ha szükséges
  const fragment = document.createDocumentFragment();
  numAr.forEach(number => {
    const liElement = document.createElement('li');
    liElement.textContent = number;
    fragment.appendChild(liElement);
  });
  ulElement.appendChild(fragment); // DOM egyszeri frissítése
}

loadData();

async function waitForElements(ulId, timeout = 10000) {
  const ulElement = document.getElementById(ulId);
  if (!ulElement) return [];
  const start = Date.now();
  const checkInterval = 100; // Ellenőrzési intervallum ms-ban
  while (Date.now() - start < timeout) {
    const liElements = ulElement.querySelectorAll('li');
    if (liElements.length > 0) {
      return Array.from(liElements).map(li => li.textContent.trim());
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  return [];// Idő túllépés esetén üres tömb
}


let jsonData0 = [];
let jsonData8 = [];

async function main() {
  jsonData0 = await waitForElements('jsonData0');
  jsonData8 = await waitForElements('jsonData8');
  fullDataLength = jsonData0.length; // Frissítjük a fullDataLength értékét a jsonData0 hosszával

  // Frissítjük a result-count elemet a jsonData0 hosszával
  const resultCountElement = document.getElementById('result-count-jsonData0');
  const resultCountElement2 = document.getElementById('result-count-jsonData8');
  if (resultCountElement, resultCountElement2) {
    resultCountElement.textContent = ` ${fullDataLength} results`;
    resultCountElement2.textContent = ` ${fullDataLength} results`;
  }
}
main();


let filteredData0 = jsonData0;
let filteredData8 = jsonData8;

function getActiveFilters() {
  const filters = {};
  document.querySelectorAll('input.active').forEach(input => {
    const index = parseInt(input.dataset.index, 10); // Ellenőrizzük, hogy számot kapunk-e
    if (!isNaN(index)) {
      filters[index] = input.value;
    }
  });
  return filters;
}


function applyFilters(data, filters, isJsonData7 = false) {
  return data.filter(item => {
    return Object.keys(filters).every(index => {
      const filterValue = filters[index];
      if (isJsonData7) {
        if (index == '5') { // jsonData7-re az utolsó előtti (index = 0) és utolsó (index = 1) karakterekre szűrünk
          return item[1] === filterValue; // Utolsó karakter szűrése
        } else if (index == '4') {
          return item[0] === filterValue; // Utolsó előtti karakter szűrése
        }
      } else {
        return item[index] === filterValue; // jsonData0 esetén az adott indexet figyeljük
      }
      return true; // Ha nincs szűrő, maradjon benne az adat
    });
  });
}

function handleButtonClick(button, index, operation) {
  const parentDiv = button.closest('div');
  const inputField = parentDiv?.querySelector('input');
  const resetBtn = parentDiv?.querySelector('[id*="reset-btn"]');
  if (!inputField || !resetBtn) return;
  if (!inputField.classList.contains('active')) {
    inputField.classList.add('active');
    resetBtn.classList.add('activeResetBtn');
  } else {
    let currentValue = parseInt(inputField.value, 10) || 0;
    if (operation === 'increase') {
      inputField.value = (currentValue + 1) % 10;
    } else if (operation === 'decrease') {
      inputField.value = (currentValue - 1 + 10) % 10;
    }
  }
  const currentValue = inputField.value;
  console.log("Current input value:", currentValue);
  // Szűrési feltételek
  const filters = getActiveFilters();
  console.log("Active filters:", filters);
  filteredData0 = applyFilters(jsonData0, filters);
  filteredData8 = applyFilters(jsonData8, filters, true);
  // Segédfüggvény a lista megjelenítésére
  function renderList(elementId, data) {
    const ulElement = document.getElementById(elementId);
    if (ulElement) {
      ulElement.innerHTML = ''; // Töröljük a régi tartalmat
      data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ulElement.appendChild(li);
      });
    }
  }
  // Megjelenítés a különböző JSON adatforrásokból
  renderList('jsonData0', filteredData0);
  renderList('jsonData8', filteredData8);
  updateDisplay(); // Megjelenítés és számlálás frissítése
}
// Növelés gombok

document.querySelectorAll('[id*="increase-btn"]').forEach((button) => {
  button.addEventListener('click', () => handleButtonClick(button, parseInt(button.dataset.index, 10), 'increase'));
});
// Csökkentés gombok

document.querySelectorAll('[id*="decrease-btn"]').forEach((button) => {
  button.addEventListener('click', () => handleButtonClick(button, parseInt(button.dataset.index, 10), 'decrease'));
});
// Reset gombok

document.querySelectorAll('[id*="reset-btn"]').forEach(button => {
  button.addEventListener('click', () => {
    const parentDiv = button.closest('div');
    const inputField = parentDiv?.querySelector('input');
    if (button.classList.contains('activeResetBtn')) {
      // Aktív státusz eltávolítása
      button.classList.remove('activeResetBtn');
      inputField.classList.remove('active');
      // Késleltetés, majd újraellenőrzés
      setTimeout(() => {
        const filters = getActiveFilters();
        console.log("Active filters after reset:", filters);
        // Szűrés frissítése
        filteredData0 = applyFilters(jsonData0, filters);
        filteredData8 = applyFilters(jsonData8, filters, true);
        // Frissítjük az eredményeket
        updateDisplay();
      }, 200);
    }
  });
});


function updateDisplay() {
  // Frissítse a HTML elemeket az új szűrt adatokkal
  displayData('jsonData0', filteredData0);
  displayData('jsonData8', filteredData8);
  // Számlálás és eredmények megjelenítése
  updateResultCount('jsonData0', jsonData0);
  updateResultCount('jsonData8', jsonData8);
}



function updateResultCount(ulId, fullData) {
  const ulElement = document.getElementById(ulId);
  if (ulElement) {
    const count = ulElement.querySelectorAll('li:not(.empty-message)').length;
    const resultCountElement = document.getElementById(`result-count-${ulId}`);
    if (resultCountElement) {
      resultCountElement.textContent = count === fullData.length ? `${count} results` : `${count} results`;
    }
  }
}


function displayData(ulId, data) {
  const ulElement = document.getElementById(ulId);
  if (!ulElement) {
    return;
  }
  ulElement.innerHTML = '';
  // Szűrők lekérése
  const filters = getActiveFilters();
  // Általános függvény a kiemeléshez
  const highlightCharacter = (item, filterIndexes) => {
    const liElement = document.createElement('li');
    item.split('').forEach((char, index) => {
      const spanElement = document.createElement('span');
      spanElement.textContent = char;
      if (filterIndexes.includes(index + (6 - item.length))) {
        const filterValue = filters[index + (6 - item.length)];
        if (char === filterValue) {
          spanElement.classList.add('highlight');
        }
      }
      liElement.appendChild(spanElement);
    });
    ulElement.appendChild(liElement);
  };
  let hasItems = false;
  data.forEach(item => {
    if (item.length === 6) {
      highlightCharacter(item, [0, 1, 2, 3, 4, 5]);
      hasItems = true;
    } else if (item.length === 3) {
      highlightCharacter(item, [3, 4, 5]);
      hasItems = true;
    } else if (item.length === 2) {
      highlightCharacter(item, [4, 5]);
      hasItems = true;
    }
  });
  if (ulElement.querySelectorAll('li').length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = 'there are no results';
    emptyMessage.classList.add('empty-message');
    ulElement.appendChild(emptyMessage);
    ulElement.classList.add('display-block');
    ulElement.classList.remove('display-grid');
  } else {
    ulElement.classList.remove('display-block');
    ulElement.classList.add('display-grid');
  }
  if (ulElement.querySelectorAll('li').length === 1) {
    const liElement = ulElement.querySelector('li');
    liElement.classList.add('single-item');
  } else {
    const liElements = ulElement.querySelectorAll('li');
    liElements.forEach(li => li.classList.remove('single-item'));
  }
  if (ulElement.querySelectorAll('li').length === 2) {
    const liElement = ulElement.querySelector('li');
    liElement.classList.add('duble-item');
  } else {
    const liElements = ulElement.querySelectorAll('li');
    liElements.forEach(li => li.classList.remove('duble-item'));
  }
}

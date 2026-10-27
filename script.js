function isValidSet(set) {
  return Array.isArray(set)
    && set.length > 0
    && set.every(anggota => (
      (typeof anggota === "number" && Number.isFinite(anggota))
      || (typeof anggota === "string" && anggota.trim() !== "")
    ))
    && new Set(set).size === set.length;
}

function isValidRelation(relasi) {
  return Array.isArray(relasi)
    && relasi.length > 0
    && relasi.every(pasangan => (
      Array.isArray(pasangan)
      && pasangan.length === 2
    ));
}

function cekFungsi(himpunan1, himpunan2, relasi) {
  if (!isValidSet(himpunan1) || !isValidSet(himpunan2) || !isValidRelation(relasi)) {
    return false;
  }

  const domain = new Set(himpunan1);
  const kodomain = new Set(himpunan2);
  const pemetaan = new Map();

  for (const [asal, tujuan] of relasi) {
    if (!domain.has(asal) || !kodomain.has(tujuan)) return false;
    if (pemetaan.has(asal)) return false;
    pemetaan.set(asal, tujuan);
  }

  return [...domain].every(anggota => pemetaan.has(anggota));
}

function cekInjektifPemetaan(himpunan1, himpunan2, relasi) {
  if (!cekFungsi(himpunan1, himpunan2, relasi)) return false;

  const hasil = new Set();
  for (const [, tujuan] of relasi) {
    if (hasil.has(tujuan)) return false;
    hasil.add(tujuan);
  }

  return true;
}

function cekSurjektifPemetaan(himpunan1, himpunan2, relasi) {
  if (!cekFungsi(himpunan1, himpunan2, relasi)) return false;

  const hasil = new Set(relasi.map(([, tujuan]) => tujuan));
  return himpunan2.every(anggota => hasil.has(anggota));
}

function cekBijektifPemetaan(himpunan1, himpunan2, relasi) {
  if (!cekFungsi(himpunan1, himpunan2, relasi)) return false;
  return cekInjektifPemetaan(himpunan1, himpunan2, relasi)
    && cekSurjektifPemetaan(himpunan1, himpunan2, relasi);
}

function ambilKoefisienFungsiLinear(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("Masukkan fungsi linear terlebih dahulu.");
  }

  try {
    const fungsi = math.parse(input);
    const simbolSelainX = fungsi.filter(node => (
      node.isSymbolNode && node.name !== "x"
    ));
    if (simbolSelainX.length > 0) {
      throw new Error("Gunakan hanya variabel x pada fungsi.");
    }

    const turunan = math.simplify(math.derivative(fungsi, "x"));
    const turunanKedua = math.simplify(math.derivative(turunan, "x"));
    if (!turunanKedua.equals(math.parse("0"))) {
      throw new Error("Fungsi harus berbentuk linear.");
    }

    const koefisien = math.evaluate(turunan.toString(), { x: 0 });
    const konstanta = math.evaluate(fungsi.toString(), { x: 0 });
    if (!Number.isFinite(koefisien) || !Number.isFinite(konstanta)) {
      throw new Error("Koefisien fungsi harus berupa angka yang valid.");
    }
    return { koefisien, konstanta };
  } catch (error) {
    if (error instanceof Error && (
      error.message.startsWith("Fungsi")
      || error.message.startsWith("Gunakan")
      || error.message.startsWith("Koefisien")
    )) {
      throw error;
    }
    throw new Error("Fungsi tidak valid. Periksa kembali penulisan ekspresinya.");
  }
}

function inversFungsiLinear(input) {
  const { koefisien, konstanta } = ambilKoefisienFungsiLinear(input);
  if (koefisien === 0) {
    throw new Error("Fungsi konstan tidak memiliki invers.");
  }

  return math.simplify(`(x - (${konstanta})) / (${koefisien})`).toString();
}

function rekursif(n, aturanRumus, aturanN, baseCase, kedalaman = 0) {
  if (!Number.isFinite(n)) {
    throw new Error("Nilai n harus berupa angka yang valid.");
  }
  if (typeof aturanRumus !== "string" || aturanRumus.trim() === "") {
    throw new Error("Aturan rumus tidak boleh kosong.");
  }
  if (typeof aturanN !== "string" || aturanN.trim() === "") {
    throw new Error("Kondisi berhenti tidak boleh kosong.");
  }
  if (!Number.isFinite(baseCase)) {
    throw new Error("Nilai dasar harus berupa angka yang valid.");
  }
  if (kedalaman > 500) {
    throw new Error("Rekursi melebihi batas 500 langkah. Periksa kondisi berhenti dan rumus.");
  }

  try {
    const kondisiBerhenti = math.evaluate(aturanN, { n });
    if (typeof kondisiBerhenti !== "boolean") {
      throw new Error("Kondisi berhenti harus menghasilkan benar atau salah.");
    }
    if (kondisiBerhenti) return baseCase;

    const hasil = math.evaluate(aturanRumus, {
      n,
      f: nilaiN => rekursif(nilaiN, aturanRumus, aturanN, baseCase, kedalaman + 1)
    });
    if (typeof hasil !== "number" || !Number.isFinite(hasil)) {
      throw new Error("Rumus rekursif harus menghasilkan angka yang valid.");
    }
    return hasil;
  } catch (error) {
    if (error instanceof Error && (
      error.message.startsWith("Kondisi")
      || error.message.startsWith("Rekursi")
      || error.message.startsWith("Rumus")
    )) {
      throw error;
    }
    throw new Error("Rumus atau kondisi rekursif tidak valid.");
  }
}

function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Elemen antarmuka "${id}" tidak ditemukan.`);
  }
  return element;
}

function showResult(element, message, isError = false) {
  element.textContent = message;
  element.className = `mt-3 min-h-6 text-sm ${isError ? "text-rose-400" : "text-emerald-400"}`;
}

function parseSetInput(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} tidak boleh kosong.`);
  }

  const values = value.split(",").map(item => item.trim());
  if (values.some(item => item === "")) {
    throw new Error(`Periksa pemisah koma pada ${label}.`);
  }

  const numbers = values.map(item => Number(item));
  if (numbers.some(number => !Number.isFinite(number))) {
    throw new Error(`Semua anggota ${label} harus berupa angka yang valid.`);
  }
  if (new Set(numbers).size !== numbers.length) {
    throw new Error(`Anggota ${label} tidak boleh duplikat.`);
  }
  return numbers;
}

function parseRelationInput(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Pasangan relasi tidak boleh kosong.");
  }

  let relasi;
  try {
    relasi = JSON.parse(`[${value}]`);
  } catch {
    throw new Error('Gunakan format array "[asal,tujuan],[asal,tujuan]", contoh: [1,4],[2,5].');
  }

  if (!Array.isArray(relasi) || relasi.length === 0) {
    throw new Error("Masukkan minimal satu pasangan relasi.");
  }
  if (!relasi.every(pasangan => (
    Array.isArray(pasangan)
    && pasangan.length === 2
    && pasangan.every(anggota => typeof anggota === "number" && Number.isFinite(anggota))
  ))) {
    throw new Error("Setiap pasangan relasi harus berisi tepat dua angka, misalnya [1,4].");
  }

  return relasi;
}

function readMappingInputs() {
  const domain = parseSetInput(getElement("domain-input").value, "Himpunan asal");
  const kodomain = parseSetInput(getElement("codomain-input").value, "Himpunan kawan");
  const relasi = parseRelationInput(getElement("relation-input").value);
  return { domain, kodomain, relasi };
}

function initializeMappingChecks() {
  const hasilFitur = {
    function: {
      resultId: "function-result",
      label: "Fungsi",
      check: cekFungsi
    },
    injective: {
      resultId: "injective-result",
      label: "Injektif",
      check: cekInjektifPemetaan
    },
    surjective: {
      resultId: "surjective-result",
      label: "Surjektif",
      check: cekSurjektifPemetaan
    },
    bijective: {
      resultId: "bijective-result",
      label: "Bijektif",
      check: cekBijektifPemetaan
    }
  };

  document.querySelectorAll("[data-mapping-check]").forEach(button => {
    button.addEventListener("click", () => {
      const feature = hasilFitur[button.dataset.mappingCheck];
      if (!feature) {
        throw new Error("Fitur pemeriksaan pemetaan tidak dikenal.");
      }

      const resultElement = getElement(feature.resultId);
      try {
        const { domain, kodomain, relasi } = readMappingInputs();
        const result = feature.check(domain, kodomain, relasi);
        showResult(
          resultElement,
          result
            ? `Ya, pemetaan tersebut ${feature.label.toLowerCase()}.`
            : `Tidak, pemetaan tersebut bukan ${feature.label.toLowerCase()}.`
        );
      } catch (error) {
        showResult(resultElement, error.message, true);
      }
    });
  });
}

function initializeInverseFeature() {
  getElement("inverse-button").addEventListener("click", () => {
    const resultElement = getElement("inverse-result");
    try {
      const input = getElement("linear-input").value;
      const invers = inversFungsiLinear(input);
      showResult(resultElement, `f⁻¹(x) = ${invers}`);
    } catch (error) {
      showResult(resultElement, error.message, true);
    }
  });
}

function initializeRecursionFeature() {
  getElement("recursion-button").addEventListener("click", () => {
    const resultElement = getElement("recursion-result");
    try {
      const nValue = getElement("recursion-n").value.trim();
      const baseCaseValue = getElement("base-case").value.trim();
      if (nValue === "" || baseCaseValue === "") {
        throw new Error("Nilai n dan nilai dasar tidak boleh kosong.");
      }

      const n = Number(nValue);
      const baseCase = Number(baseCaseValue);
      if (!Number.isInteger(n) || n < 0 || n > 500) {
        throw new Error("Nilai n harus bilangan bulat antara 0 dan 500.");
      }
      if (!Number.isFinite(baseCase)) {
        throw new Error("Nilai dasar harus berupa angka yang valid.");
      }

      const hasil = rekursif(
        n,
        getElement("recursion-rule").value,
        getElement("stop-rule").value,
        baseCase
      );
      showResult(resultElement, `Hasil f(${n}) = ${hasil}`);
    } catch (error) {
      showResult(resultElement, error.message, true);
    }
  });
}

function initializeApp() {
  initializeMappingChecks();
  initializeInverseFeature();
  initializeRecursionFeature();
}

initializeApp();

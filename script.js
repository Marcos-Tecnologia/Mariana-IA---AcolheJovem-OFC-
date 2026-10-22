"use strict";

const MODEL = ({
  minQuestions: 1, maxQuestions: 50, minAlternatives: 2, maxAlternatives: 5,
  alternatives: ["A","B","C","D","E"], oneColumnWidth: 150, twoColumnWidth: 196,
  outerInset: 2, markerInset: 5, markerSize: 5, bubbleRadius: 2.5, rowPitch: 8,
  headerY: 17, firstRowY: 27, bottomPadding: 14, numberLocalX: 11, bubbleGap: 13,
  answerBandCenterX: 60, oneColumnOriginX: 27, twoColumnOrigins: [6,101], previewPxPerMm: 3
});

const STORAGE = Object.freeze({
  tests: "gabarita_tests_v140", settings: "gabarita_settings_v140", history: "gabarita_history_v140",
  oldTests: "gabarita_tests_v130", oldSettings: "gabarita_settings_v130", oldHistory: "gabarita_history_v130",
  olderTests: "gabarita_tests_v120", olderSettings: "gabarita_settings_v120", olderHistory: "gabarita_history_v120",
  legacyTests: "gabaritos_app_tests_v110"
});
const AUTO_BACKUP_KEY = "gabarita_auto_backups_v140";
const $ = id => document.getElementById(id);
const els = {
  navButtons:[...document.querySelectorAll(".nav-btn")], views:[...document.querySelectorAll(".view")],
  genQuestionCount:$("genQuestionCount"),genAlternativeCount:$("genAlternativeCount"),generatorCanvas:$("generatorCanvas"),genLayoutInfo:$("genLayoutInfo"),genBadge:$("genBadge"),downloadPdfBtn:$("downloadPdfBtn"),downloadPngBtn:$("downloadPngBtn"),genStatus:$("genStatus"),
  newTestBtn:$("newTestBtn"),emptyNewTestBtn:$("emptyNewTestBtn"),testsEmpty:$("testsEmpty"),testsList:$("testsList"),editorPanel:$("editorPanel"),editorTitle:$("editorTitle"),cancelEditorBtn:$("cancelEditorBtn"),testName:$("testName"),testQuestionCount:$("testQuestionCount"),testAlternativeCount:$("testAlternativeCount"),testMaxScore:$("testMaxScore"),annulledAwardPoint:$("annulledAwardPoint"),answerKeyGrid:$("answerKeyGrid"),answerProgress:$("answerProgress"),saveTestBtn:$("saveTestBtn"),editorMessage:$("editorMessage"),
  scanTestSelect:$("scanTestSelect"),selectedTestInfo:$("selectedTestInfo"),studentId:$("studentId"),sequenceMode:$("sequenceMode"),takePhotoBtn:$("takePhotoBtn"),chooseImageBtn:$("chooseImageBtn"),selfTestBtn:$("selfTestBtn"),imageFileInput:$("imageFileInput"),markSensitivity:$("markSensitivity"),sensitivityValue:$("sensitivityValue"),analyzeBtn:$("analyzeBtn"),scanMessage:$("scanMessage"),qualityBox:$("qualityBox"),qualityStatus:$("qualityStatus"),qualityDetails:$("qualityDetails"),imagePlaceholder:$("imagePlaceholder"),photoCanvas:$("photoCanvas"),
  resultPanel:$("resultPanel"),resultCorrect:$("resultCorrect"),resultWrong:$("resultWrong"),resultBlank:$("resultBlank"),resultMultiple:$("resultMultiple"),resultAnnulled:$("resultAnnulled"),resultReview:$("resultReview"),resultPercent:$("resultPercent"),resultGrade:$("resultGrade"),resultRows:$("resultRows"),resultSavedBadge:$("resultSavedBadge"),exportCurrentCsvBtn:$("exportCurrentCsvBtn"),exportCurrentPdfBtn:$("exportCurrentPdfBtn"),nextCorrectionBtn:$("nextCorrectionBtn"),
  historyEmpty:$("historyEmpty"),historyList:$("historyList"),exportHistoryCsvBtn:$("exportHistoryCsvBtn"),
  exportBackupBtn:$("exportBackupBtn"),importBackupBtn:$("importBackupBtn"),backupFileInput:$("backupFileInput"),backupMessage:$("backupMessage"),installAppBtn:$("installAppBtn"),persistStorageBtn:$("persistStorageBtn"),installMessage:$("installMessage"),offlineStatus:$("offlineStatus"),dataStats:$("dataStats"),dataExportHistoryBtn:$("dataExportHistoryBtn"),clearHistoryBtn:$("clearHistoryBtn"),
  cameraModal:$("cameraModal"),cameraVideo:$("cameraVideo"),closeCameraBtn:$("closeCameraBtn"),capturePhotoBtn:$("capturePhotoBtn"),cameraMessage:$("cameraMessage")
};

function safeParse(v,f){try{return v?JSON.parse(v):f}catch{return f}}
function normalizeTest(t){
  const q=clampInt(t?.questionCount,1,50,10), a=clampInt(t?.alternativeCount,2,5,5), letters=alternativesFor(a);
  return {...t,id:t?.id||uid("gabarito"),name:t?.name||"Gabarito",questionCount:q,alternativeCount:a,
    answers:Array.from({length:q},(_,i)=>letters.includes(t?.answers?.[i])?t.answers[i]:""),
    annulled:Array.from({length:q},(_,i)=>!!t?.annulled?.[i]), maxScore:Number(t?.maxScore)>0?Number(t.maxScore):10,
    annulledAwardPoint:t?.annulledAwardPoint!==false,createdAt:t?.createdAt||new Date().toISOString(),updatedAt:t?.updatedAt||new Date().toISOString()};
}
function loadArray(primary,...legacy){for(const k of [primary,...legacy]){const v=safeParse(localStorage.getItem(k),null);if(Array.isArray(v)){if(k!==primary)localStorage.setItem(primary,JSON.stringify(v));return v}}return[]}
function loadTests(){return loadArray(STORAGE.tests,STORAGE.oldTests,STORAGE.legacyTests).map(normalizeTest)}
function loadHistory(){return loadArray(STORAGE.history,STORAGE.oldHistory)}
function loadSettings(){const d={generatorQuestions:10,generatorAlternatives:5,sensitivity:30,selectedTestId:"",currentView:"generator",sequenceMode:false,studentId:""};const old=safeParse(localStorage.getItem(STORAGE.oldSettings),{});return {...d,...old,...safeParse(localStorage.getItem(STORAGE.settings),{})}}
const state={tests:loadTests(),settings:loadSettings(),history:loadHistory(),editingId:null,draftAnswers:[],draftAnnulled:[],currentImageCanvas:null,cameraStream:null,lastDetection:null,currentResults:[],currentCorrectionId:null,currentQuality:null,activeResultTest:null,deferredInstall:null};
function saveTests(){localStorage.setItem(STORAGE.tests,JSON.stringify(state.tests))} function saveSettings(){localStorage.setItem(STORAGE.settings,JSON.stringify(state.settings))} function saveHistory(){localStorage.setItem(STORAGE.history,JSON.stringify(state.history))}
function uid(prefix="id"){return crypto.randomUUID?.()||`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
function clampInt(v,min,max,f){const n=Number.parseInt(v,10);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):f} function clamp(v,min,max){return Math.min(max,Math.max(min,v))}
function alternativesFor(c){return MODEL.alternatives.slice(0,clampInt(c,2,5,5))} function escapeHtml(s){return String(s).replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]))}
function setMessage(el,text,type=""){el.textContent=text;el.className=`message${type?" "+type:""}`}
function formatNumber(n,d=2){return Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:d})}
function downloadBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}

function bubbleXs(count) {
  const n = clampInt(count, 2, 5, 5);
  const total = (n - 1) * MODEL.bubbleGap;
  const start = MODEL.answerBandCenterX - total / 2;
  return Array.from({ length: n }, (_, i) => start + i * MODEL.bubbleGap);
}

function layoutFor(questionCount, alternativeCount) {
  const q = clampInt(questionCount, 1, 50, 10);
  const a = clampInt(alternativeCount, 2, 5, 5);
  const columns = q <= 25 ? 1 : 2;
  const rowsPerColumn = Math.ceil(q / columns);
  const widthMm = columns === 1 ? MODEL.oneColumnWidth : MODEL.twoColumnWidth;
  const heightMm = Math.ceil(MODEL.firstRowY + (rowsPerColumn - 1) * MODEL.rowPitch + MODEL.bubbleRadius + MODEL.bottomPadding);
  return {
    questionCount: q,
    alternativeCount: a,
    alternatives: alternativesFor(a),
    bubbleXs: bubbleXs(a),
    columns,
    rowsPerColumn,
    widthMm,
    heightMm,
    columnOrigins: columns === 1 ? [MODEL.oneColumnOriginX] : [...MODEL.twoColumnOrigins]
  };
}

function questionNumber(layout, columnIndex, rowIndex) {
  return columnIndex * layout.rowsPerColumn + rowIndex + 1;
}

function drawSheet(renderer, layout, filledAnswers = null) {
  renderer.strokeRect(MODEL.outerInset, MODEL.outerInset, layout.widthMm - MODEL.outerInset * 2, layout.heightMm - MODEL.outerInset * 2, .45);
  const left = MODEL.markerInset;
  const right = layout.widthMm - MODEL.markerInset - MODEL.markerSize;
  const top = MODEL.markerInset;
  const bottom = layout.heightMm - MODEL.markerInset - MODEL.markerSize;
  renderer.fillRect(left, top, MODEL.markerSize, MODEL.markerSize);
  renderer.fillRect(right, top, MODEL.markerSize, MODEL.markerSize);
  renderer.fillRect(left, bottom, MODEL.markerSize, MODEL.markerSize);
  renderer.fillRect(right, bottom, MODEL.markerSize, MODEL.markerSize);

  for (let c = 0; c < layout.columns; c++) {
    const originX = layout.columnOrigins[c];
    layout.alternatives.forEach((letter, i) => renderer.text(letter, originX + layout.bubbleXs[i], MODEL.headerY, 3.5, true, "center"));
    for (let r = 0; r < layout.rowsPerColumn; r++) {
      const qn = questionNumber(layout, c, r);
      if (qn > layout.questionCount) continue;
      const y = MODEL.firstRowY + r * MODEL.rowPitch;
      renderer.text(String(qn).padStart(2, "0"), originX + MODEL.numberLocalX, y + 1.1, 3.2, true, "center");
      layout.bubbleXs.forEach((x, i) => {
        renderer.circle(originX + x, y, MODEL.bubbleRadius, .55);
        if (filledAnswers && filledAnswers[qn - 1] === layout.alternatives[i]) renderer.fillCircle(originX + x, y, 1.55);
      });
    }
  }
}

function canvasRenderer(ctx, scale) {
  const mm = (v) => v * scale;
  return {
    strokeRect(x,y,w,h,l){ctx.save();ctx.strokeStyle="#000";ctx.lineWidth=Math.max(1,mm(l));ctx.strokeRect(mm(x),mm(y),mm(w),mm(h));ctx.restore();},
    fillRect(x,y,w,h){ctx.save();ctx.fillStyle="#000";ctx.fillRect(mm(x),mm(y),mm(w),mm(h));ctx.restore();},
    circle(x,y,r,l){ctx.save();ctx.beginPath();ctx.arc(mm(x),mm(y),mm(r),0,Math.PI*2);ctx.strokeStyle="#000";ctx.lineWidth=Math.max(1,mm(l));ctx.stroke();ctx.restore();},
    fillCircle(x,y,r){ctx.save();ctx.beginPath();ctx.arc(mm(x),mm(y),mm(r),0,Math.PI*2);ctx.fillStyle="#000";ctx.fill();ctx.restore();},
    text(value,x,y,size,bold=false,align="left"){ctx.save();ctx.fillStyle="#000";ctx.textAlign=align;ctx.textBaseline="alphabetic";ctx.font=`${bold?700:400} ${mm(size)}px Arial,Helvetica,sans-serif`;ctx.fillText(value,mm(x),mm(y));ctx.restore();}
  };
}

function renderGenerator(normalizeInput = false) {
  const raw = Number.parseInt(els.genQuestionCount.value, 10);
  const q = Number.isFinite(raw) ? clampInt(raw, 1, 50, 10) : 10;
  const a = clampInt(els.genAlternativeCount.value, 2, 5, 5);
  if (normalizeInput) els.genQuestionCount.value = q;
  els.genAlternativeCount.value = a;
  state.settings.generatorQuestions = q;
  state.settings.generatorAlternatives = a;
  saveSettings();

  const layout = layoutFor(q, a);
  const scale = MODEL.previewPxPerMm;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const cw = Math.round(layout.widthMm * scale);
  const ch = Math.round(layout.heightMm * scale);
  els.generatorCanvas.width = cw * dpr;
  els.generatorCanvas.height = ch * dpr;
  els.generatorCanvas.style.width = `${cw}px`;
  els.generatorCanvas.style.height = `${ch}px`;
  const ctx = els.generatorCanvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0,0,cw,ch);
  drawSheet(canvasRenderer(ctx, scale), layout);
  const last = layout.alternatives.at(-1);
  els.genBadge.textContent = `${q} ${q===1?"questão":"questões"} • A–${last}`;
  els.genLayoutInfo.innerHTML = `<strong>${layout.columns===1?"1 coluna":"2 colunas"}</strong><br>Alternativas: ${layout.alternatives.join(" • ")}<br>Bloco: ${layout.widthMm} × ${layout.heightMm} mm`;
}

function downloadPng() {
  renderGenerator();
  els.generatorCanvas.toBlob((blob) => {
    if (!blob) return setMessage(els.genStatus, "Não foi possível gerar a imagem.", "error");
    const a = document.createElement("a");
    const q = els.genQuestionCount.value;
    const last = alternativesFor(els.genAlternativeCount.value).at(-1).toLowerCase();
    a.href = URL.createObjectURL(blob);
    a.download = `gabarito-${q}-questoes-a-${last}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMessage(els.genStatus, "PNG gerado.", "ok");
  }, "image/png");
}

function pdfEscapeText(s) { return String(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)"); }
function pdfNumber(n) { return Number(n.toFixed(3)).toString(); }

function createPdfBytes(layout) {
  const MM_TO_PT = 72 / 25.4;
  const pageW = layout.widthMm * MM_TO_PT;
  const pageH = layout.heightMm * MM_TO_PT;
  const pt = (mm) => mm * MM_TO_PT;
  const py = (mm) => pageH - pt(mm);
  const commands = [];

  const renderer = {
    strokeRect(x,y,w,h,l) {
      commands.push(`${pdfNumber(pt(l))} w 0 G ${pdfNumber(pt(x))} ${pdfNumber(pageH-pt(y+h))} ${pdfNumber(pt(w))} ${pdfNumber(pt(h))} re S`);
    },
    fillRect(x,y,w,h) {
      commands.push(`0 g ${pdfNumber(pt(x))} ${pdfNumber(pageH-pt(y+h))} ${pdfNumber(pt(w))} ${pdfNumber(pt(h))} re f`);
    },
    circle(x,y,r,l) {
      const cx=pt(x), cy=py(y), rr=pt(r), k=.5522847498, kr=rr*k;
      commands.push(`${pdfNumber(pt(l))} w 0 G ${pdfNumber(cx+rr)} ${pdfNumber(cy)} m ${pdfNumber(cx+rr)} ${pdfNumber(cy+kr)} ${pdfNumber(cx+kr)} ${pdfNumber(cy+rr)} ${pdfNumber(cx)} ${pdfNumber(cy+rr)} c ${pdfNumber(cx-kr)} ${pdfNumber(cy+rr)} ${pdfNumber(cx-rr)} ${pdfNumber(cy+kr)} ${pdfNumber(cx-rr)} ${pdfNumber(cy)} c ${pdfNumber(cx-rr)} ${pdfNumber(cy-kr)} ${pdfNumber(cx-kr)} ${pdfNumber(cy-rr)} ${pdfNumber(cx)} ${pdfNumber(cy-rr)} c ${pdfNumber(cx+kr)} ${pdfNumber(cy-rr)} ${pdfNumber(cx+rr)} ${pdfNumber(cy-kr)} ${pdfNumber(cx+rr)} ${pdfNumber(cy)} c S`);
    },
    fillCircle(x,y,r) {
      const cx=pt(x), cy=py(y), rr=pt(r), k=.5522847498, kr=rr*k;
      commands.push(`0 g ${pdfNumber(cx+rr)} ${pdfNumber(cy)} m ${pdfNumber(cx+rr)} ${pdfNumber(cy+kr)} ${pdfNumber(cx+kr)} ${pdfNumber(cy+rr)} ${pdfNumber(cx)} ${pdfNumber(cy+rr)} c ${pdfNumber(cx-kr)} ${pdfNumber(cy+rr)} ${pdfNumber(cx-rr)} ${pdfNumber(cy+kr)} ${pdfNumber(cx-rr)} ${pdfNumber(cy)} c ${pdfNumber(cx-rr)} ${pdfNumber(cy-kr)} ${pdfNumber(cx-kr)} ${pdfNumber(cy-rr)} ${pdfNumber(cx)} ${pdfNumber(cy-rr)} c ${pdfNumber(cx+kr)} ${pdfNumber(cy-rr)} ${pdfNumber(cx+rr)} ${pdfNumber(cy-kr)} ${pdfNumber(cx+rr)} ${pdfNumber(cy)} c f`);
    },
    text(value,x,y,size,bold=false,align="left") {
      const fontSize = pt(size);
      const approxWidth = fontSize * .56 * String(value).length;
      let tx = pt(x);
      if (align === "center") tx -= approxWidth/2;
      if (align === "right") tx -= approxWidth;
      commands.push(`BT /${bold?"F2":"F1"} ${pdfNumber(fontSize)} Tf 0 g ${pdfNumber(tx)} ${pdfNumber(py(y))} Td (${pdfEscapeText(value)}) Tj ET`);
    }
  };

  drawSheet(renderer, layout);
  const stream = commands.join("\n");
  const objects = [];
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`;
  objects[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNumber(pageW)} ${pdfNumber(pageH)}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`;
  objects[4] = `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`;
  objects[5] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  objects[6] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;

  let pdf = "%PDF-1.4\n%Gabarita\n";
  const offsets = [0];
  for (let i=1;i<=6;i++) {
    offsets[i] = new TextEncoder().encode(pdf).length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 7\n0000000000 65535 f \n`;
  for (let i=1;i<=6;i++) pdf += `${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
  pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

function generatePdf() {
  try {
    const q = clampInt(els.genQuestionCount.value,1,50,10);
    const a = clampInt(els.genAlternativeCount.value,2,5,5);
    const layout = layoutFor(q,a);
    const bytes = createPdfBytes(layout);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const link = document.createElement("a");
    const last = layout.alternatives.at(-1).toLowerCase();
    link.href = URL.createObjectURL(blob);
    link.download = `gabarito-${q}-questoes-a-${last}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setMessage(els.genStatus, "PDF gerado.", "ok");
  } catch (error) {
    console.error(error);
    setMessage(els.genStatus, "Não consegui gerar o PDF.", "error");
  }
}



function renderTests(){
  els.testsList.innerHTML="";els.testsEmpty.classList.toggle("hidden",state.tests.length>0);
  state.tests.forEach(test=>{const card=document.createElement("article");card.className="test-card";const last=alternativesFor(test.alternativeCount).at(-1);const annulled=test.annulled.filter(Boolean).length;
    card.innerHTML=`<h3></h3><div class="test-meta"><span class="badge">${test.questionCount} questões</span><span class="badge">A–${last}</span><span class="badge">Nota ${formatNumber(test.maxScore,1)}</span>${annulled?`<span class="badge">${annulled} anulada${annulled>1?"s":""}</span>`:""}</div><div class="card-actions"><button class="btn primary" data-action="correct" data-id="${test.id}">Corrigir</button><button class="btn secondary" data-action="edit" data-id="${test.id}">Editar</button><button class="btn secondary" data-action="duplicate" data-id="${test.id}">Duplicar</button><button class="btn danger" data-action="delete" data-id="${test.id}">Excluir</button></div>`;
    card.querySelector("h3").textContent=test.name;els.testsList.appendChild(card)});renderScanSelect();updateDataStats();
}
function openEditor(test=null){state.editingId=test?.id||null;els.editorPanel.classList.remove("hidden");els.editorTitle.textContent=test?"Editar gabarito":"Novo gabarito";els.testName.value=test?.name||"";els.testQuestionCount.value=test?.questionCount||10;els.testAlternativeCount.value=test?.alternativeCount||5;els.testMaxScore.value=test?.maxScore??10;els.annulledAwardPoint.checked=test?.annulledAwardPoint!==false;state.draftAnswers=test?.answers?[...test.answers]:Array(10).fill("");state.draftAnnulled=test?.annulled?[...test.annulled]:Array(state.draftAnswers.length).fill(false);renderAnswerGrid(true);els.editorPanel.scrollIntoView({behavior:"smooth",block:"start"})}
function closeEditor(){els.editorPanel.classList.add("hidden");state.editingId=null;state.draftAnswers=[];state.draftAnnulled=[];setMessage(els.editorMessage,"")}
function getEditorQuestionCount(){const n=Number.parseInt(els.testQuestionCount.value,10);return Number.isFinite(n)&&n>=1&&n<=50?n:null}
function renderAnswerGrid(normalizeInput=false){let q=getEditorQuestionCount();if(q===null){if(normalizeInput){q=10;els.testQuestionCount.value=10}else return}const a=clampInt(els.testAlternativeCount.value,2,5,5),letters=alternativesFor(a);if(normalizeInput)els.testQuestionCount.value=q;state.draftAnswers=Array.from({length:q},(_,i)=>letters.includes(state.draftAnswers[i])?state.draftAnswers[i]:"");state.draftAnnulled=Array.from({length:q},(_,i)=>!!state.draftAnnulled[i]);els.answerKeyGrid.innerHTML="";
  for(let i=0;i<q;i++){const row=document.createElement("div");row.className=`answer-row${state.draftAnnulled[i]?" annulled":""}`;row.innerHTML=`<span class="question-label">${String(i+1).padStart(2,"0")}</span><div class="choice-group"></div><button type="button" class="annul-btn${state.draftAnnulled[i]?" active":""}" data-annul-index="${i}">${state.draftAnnulled[i]?"Anulada":"Anular"}</button>`;const group=row.querySelector(".choice-group");letters.forEach(letter=>{const b=document.createElement("button");b.type="button";b.disabled=state.draftAnnulled[i];b.className=`choice-btn${state.draftAnswers[i]===letter?" active":""}`;b.textContent=letter;b.dataset.index=i;b.dataset.letter=letter;group.appendChild(b)});els.answerKeyGrid.appendChild(row)} updateAnswerProgress()}
function updateAnswerProgress(){let ok=0;for(let i=0;i<state.draftAnswers.length;i++)if(state.draftAnnulled[i]||state.draftAnswers[i])ok++;els.answerProgress.textContent=`${ok}/${state.draftAnswers.length}`}
function saveCurrentTest(){const name=els.testName.value.trim(),q=clampInt(els.testQuestionCount.value,1,50,10),a=clampInt(els.testAlternativeCount.value,2,5,5),maxScore=Number(String(els.testMaxScore.value).replace(",","."));if(!name)return setMessage(els.editorMessage,"Digite o nome da prova.","error");if(!(maxScore>0))return setMessage(els.editorMessage,"Informe uma nota máxima válida.","error");if(state.draftAnswers.length!==q||state.draftAnswers.some((x,i)=>!state.draftAnnulled[i]&&!x))return setMessage(els.editorMessage,"Marque a resposta correta de todas as questões não anuladas.","error");const existing=state.tests.find(x=>x.id===state.editingId);const obj=normalizeTest({id:state.editingId||uid("gabarito"),name,questionCount:q,alternativeCount:a,answers:[...state.draftAnswers],annulled:[...state.draftAnnulled],maxScore,annulledAwardPoint:els.annulledAwardPoint.checked,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});const idx=state.tests.findIndex(x=>x.id===obj.id);idx>=0?state.tests[idx]=obj:state.tests.push(obj);saveTests();renderTests();closeEditor();switchView("register")}
function duplicateTest(id){const t=state.tests.find(x=>x.id===id);if(!t)return;const copy=normalizeTest({...t,id:uid("gabarito"),name:`${t.name} - Cópia`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});state.tests.push(copy);saveTests();renderTests();setTimeout(()=>openEditor(copy),0)}
function deleteTest(id){const t=state.tests.find(x=>x.id===id);if(!t||!confirm(`Excluir “${t.name}”? O histórico já salvo será mantido.`))return;state.tests=state.tests.filter(x=>x.id!==id);saveTests();renderTests()}
function renderScanSelect(){const preferred=state.settings.selectedTestId,current=els.scanTestSelect.value||preferred;els.scanTestSelect.innerHTML="";if(!state.tests.length){const o=document.createElement("option");o.value="";o.textContent="Cadastre um gabarito primeiro";els.scanTestSelect.appendChild(o)}else{state.tests.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=t.name;els.scanTestSelect.appendChild(o)});els.scanTestSelect.value=state.tests.some(x=>x.id===current)?current:state.tests[0].id}state.settings.selectedTestId=els.scanTestSelect.value;saveSettings();updateSelectedTestInfo()}
function getSelectedTest(){return state.tests.find(x=>x.id===els.scanTestSelect.value)||null}
function updateSelectedTestInfo(){const t=getSelectedTest();state.settings.selectedTestId=t?.id||"";saveSettings();if(!t){els.selectedTestInfo.textContent="Nenhum gabarito cadastrado.";els.analyzeBtn.disabled=true;return}const last=alternativesFor(t.alternativeCount).at(-1),ann=t.annulled.filter(Boolean).length;els.selectedTestInfo.innerHTML=`<strong>${escapeHtml(t.name)}</strong><br>${t.questionCount} questões • A–${last} • Nota ${formatNumber(t.maxScore,1)}${ann?` • ${ann} anulada${ann>1?"s":""}`:""}`;els.analyzeBtn.disabled=!state.currentImageCanvas;if(state.currentImageCanvas)updatePhotoQuality()}


async function refreshCameraPermissionStatus(){
  const box=document.getElementById("cameraPermissionBox"),title=document.getElementById("cameraPermissionTitle"),text=document.getElementById("cameraPermissionText");
  if(!box||!title||!text)return;
  box.className="camera-permission neutral";title.textContent="Câmera";
  if(!window.isSecureContext&&location.hostname!=="localhost"&&location.hostname!=="127.0.0.1"){box.className="camera-permission bad";text.textContent="A câmera direta exige HTTPS.";return}
  if(!navigator.mediaDevices?.getUserMedia){box.className="camera-permission bad";text.textContent="Este navegador não oferece câmera direta.";return}
  try{
    if(navigator.permissions?.query){
      const p=await navigator.permissions.query({name:"camera"});
      const paint=()=>{if(p.state==="granted"){box.className="camera-permission good";title.textContent="Câmera permitida";text.textContent="O navegador já autorizou a câmera para este site."}else if(p.state==="denied"){box.className="camera-permission bad";title.textContent="Câmera bloqueada";text.textContent="No Chrome, abra as permissões deste site e mude Câmera para Permitir; depois tente novamente."}else{box.className="camera-permission warn";title.textContent="Permissão da câmera";text.textContent="Ao tocar em Tirar foto, o navegador deverá perguntar se pode usar a câmera."}};
      paint();p.onchange=paint;return;
    }
  }catch(_){/* Alguns navegadores não expõem camera no Permissions API. */}
  box.className="camera-permission warn";title.textContent="Permissão da câmera";text.textContent="Ao tocar em Tirar foto, o navegador pode solicitar a permissão.";
}

async function openCamera() {
  await refreshCameraPermissionStatus();
  if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    return setMessage(els.scanMessage, "A câmera direta exige HTTPS. No GitHub Pages/Vercel ela funcionará normalmente.", "error");
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return setMessage(els.scanMessage, "Este navegador não oferece acesso direto à câmera.", "error");
  }

  closeCamera();
  els.cameraModal.classList.remove("hidden");
  els.cameraMessage.textContent = "O navegador solicitará permissão para usar a câmera.";

  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    els.cameraVideo.srcObject = state.cameraStream;
    await els.cameraVideo.play();
    els.cameraMessage.textContent = "Enquadre o gabarito inteiro, com as quatro marcas pretas visíveis.";
    refreshCameraPermissionStatus();
  } catch (err) {
    console.error(err);
    closeCamera();
    const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
    setMessage(els.scanMessage, denied
      ? "A câmera está bloqueada neste navegador. No Chrome, abra as permissões deste site, coloque Câmera em Permitir e tente novamente."
      : "Não consegui abrir a câmera. Verifique se outra aplicação está usando a câmera.", "error");
    refreshCameraPermissionStatus();
  }
}

function closeCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
  if (els.cameraVideo) els.cameraVideo.srcObject = null;
  els.cameraModal.classList.add("hidden");
}

function capturePhoto() {
  const v = els.cameraVideo;
  if (!v.videoWidth || !v.videoHeight) {
    els.cameraMessage.textContent = "A câmera ainda não está pronta.";
    return;
  }
  const max = 2600;
  const scale = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(v.videoWidth * scale);
  c.height = Math.round(v.videoHeight * scale);
  const ctx = c.getContext("2d", { willReadFrequently:true });
  ctx.drawImage(v, 0, 0, c.width, c.height);
  setCurrentImageCanvas(c);
  closeCamera();
  setMessage(els.scanMessage, "Foto capturada. Toque em Analisar gabarito.", "ok");
}

function chooseImage() {
  if(state.cameraStream)closeCamera();
  els.imageFileInput.value = "";
  els.imageFileInput.click();
}

async function fileToImage(file) {
  if ("createImageBitmap" in window) {
    try { return await createImageBitmap(file, { imageOrientation:"from-image" }); } catch {}
  }
  return await new Promise((resolve,reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Imagem inválida")); };
    img.src = url;
  });
}

async function loadImageFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return setMessage(els.scanMessage, "Escolha um arquivo de imagem.", "error");
  try {
    const img = await fileToImage(file);
    const max = 2800;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext("2d", {willReadFrequently:true}).drawImage(img,0,0,c.width,c.height);
    setCurrentImageCanvas(c);
    setMessage(els.scanMessage, "Imagem recebida. Corrigindo…", "ok");
    if(getSelectedTest()) analyzeCurrentImage();
    if (img.close) img.close();
  } catch (err) {
    console.error(err);
    setMessage(els.scanMessage, "Não consegui abrir essa imagem. Tente JPG, PNG ou WEBP.", "error");
  }
}

function renderPhotoPreview() {
  if (!state.currentImageCanvas) return;
  const src = state.currentImageCanvas;
  const max = 1600;
  const scale = Math.min(1, max / Math.max(src.width, src.height));
  els.photoCanvas.width = Math.round(src.width * scale);
  els.photoCanvas.height = Math.round(src.height * scale);
  els.photoCanvas.getContext("2d").drawImage(src,0,0,els.photoCanvas.width,els.photoCanvas.height);
}

function percentileBounds(gray, lowPercent = .02, highPercent = .98) {
  const hist = new Uint32Array(256);
  for (const g of gray) hist[g]++;
  const total = gray.length;
  let cumulative = 0, low = 0, high = 255;
  for (let i=0;i<256;i++) { cumulative += hist[i]; if (cumulative >= total*lowPercent) { low=i; break; } }
  cumulative = 0;
  for (let i=0;i<256;i++) { cumulative += hist[i]; if (cumulative >= total*highPercent) { high=i; break; } }
  if (high - low < 45) { low = Math.max(0, low - 20); high = Math.min(255, high + 20); }
  return { low, high };
}

function normalizeGray(gray) {
  const {low, high} = percentileBounds(gray);
  const out = new Uint8Array(gray.length);
  const span = Math.max(1, high-low);
  for (let i=0;i<gray.length;i++) out[i] = clamp(Math.round((gray[i]-low)*255/span),0,255);
  return out;
}

function getAnalysisImage(source, maxSide = 1200) {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const c = document.createElement("canvas");
  c.width = Math.round(source.width * scale);
  c.height = Math.round(source.height * scale);
  const ctx = c.getContext("2d", {willReadFrequently:true});
  ctx.drawImage(source,0,0,c.width,c.height);
  const d = ctx.getImageData(0,0,c.width,c.height);
  const gray = new Uint8Array(c.width*c.height);
  for (let i=0,j=0;i<d.data.length;i+=4,j++) gray[j] = Math.round(.299*d.data[i] + .587*d.data[i+1] + .114*d.data[i+2]);
  return { canvas:c, gray, normalized:normalizeGray(gray), width:c.width, height:c.height, scale };
}

function buildIntegral(gray,w,h) {
  const stride = w+1;
  const integral = new Float64Array((w+1)*(h+1));
  for (let y=1;y<=h;y++) {
    let rowSum = 0;
    for (let x=1;x<=w;x++) {
      rowSum += gray[(y-1)*w + (x-1)];
      integral[y*stride+x] = integral[(y-1)*stride+x] + rowSum;
    }
  }
  return integral;
}

function rectMean(integral,w,h,x0,y0,x1,y1) {
  x0=clamp(Math.floor(x0),0,w-1); y0=clamp(Math.floor(y0),0,h-1);
  x1=clamp(Math.ceil(x1),x0+1,w); y1=clamp(Math.ceil(y1),y0+1,h);
  const stride=w+1;
  const sum=integral[y1*stride+x1]-integral[y0*stride+x1]-integral[y1*stride+x0]+integral[y0*stride+x0];
  return sum/((x1-x0)*(y1-y0));
}

function findDarkComponents(gray,w,h) {
  const integral = buildIntegral(gray,w,h);
  const radius = clamp(Math.round(Math.min(w,h)*.025),14,36);
  const dark = new Uint8Array(gray.length);
  for (let y=0;y<h;y++) {
    for (let x=0;x<w;x++) {
      const i=y*w+x;
      const mean=rectMean(integral,w,h,x-radius,y-radius,x+radius+1,y+radius+1);
      const delta=Math.max(24,mean*.12);
      dark[i]=(gray[i] < mean-delta || gray[i] < 48) ? 1 : 0;
    }
  }

  const visited = new Uint8Array(gray.length);
  const stack = new Int32Array(gray.length);
  const comps = [];
  const minArea = Math.max(18, Math.floor(gray.length*.000012));
  const maxArea = Math.floor(gray.length*.03);

  for (let y=1;y<h-1;y++) for (let x=1;x<w-1;x++) {
    const start=y*w+x;
    if (!dark[start] || visited[start]) continue;
    let top=0; stack[top++]=start; visited[start]=1;
    let count=0,minX=x,maxX=x,minY=y,maxY=y;
    while (top) {
      const p=stack[--top], py=Math.floor(p/w), px=p-py*w;
      count++;
      if(px<minX)minX=px;if(px>maxX)maxX=px;if(py<minY)minY=py;if(py>maxY)maxY=py;
      const ns=[p-1,p+1,p-w,p+w];
      if(px>0&&!visited[ns[0]]&&dark[ns[0]]){visited[ns[0]]=1;stack[top++]=ns[0];}
      if(px<w-1&&!visited[ns[1]]&&dark[ns[1]]){visited[ns[1]]=1;stack[top++]=ns[1];}
      if(py>0&&!visited[ns[2]]&&dark[ns[2]]){visited[ns[2]]=1;stack[top++]=ns[2];}
      if(py<h-1&&!visited[ns[3]]&&dark[ns[3]]){visited[ns[3]]=1;stack[top++]=ns[3];}
    }
    if (count<minArea || count>maxArea) continue;
    const bw=maxX-minX+1,bh=maxY-minY+1,aspect=bw/bh,fill=count/(bw*bh);
    if(bw<4||bh<4||aspect<.5||aspect>2||fill<.38) continue;
    comps.push({x:(minX+maxX)/2,y:(minY+maxY)/2,w:bw,h:bh,area:count,fill});
  }
  return comps.sort((a,b)=>b.area-a.area).slice(0,32);
}

function orderQuad(items) {
  const pts=items.map(x=>({x:x.x,y:x.y,item:x}));
  const tl=pts.reduce((a,b)=>a.x+a.y<b.x+b.y?a:b);
  const br=pts.reduce((a,b)=>a.x+a.y>b.x+b.y?a:b);
  const tr=pts.reduce((a,b)=>a.x-a.y>b.x-b.y?a:b);
  const bl=pts.reduce((a,b)=>a.x-a.y<b.x-b.y?a:b);
  const ordered=[tl,tr,br,bl];
  if(new Set(ordered.map(p=>p.item)).size<4)return null;
  return ordered;
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function polygonArea(p){let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=a.x*b.y-b.x*a.y;}return Math.abs(s)/2;}

function chooseMarkerQuad(candidates,layout,w,h) {
  const n=Math.min(candidates.length,22);
  if(n<4)return null;
  const expected=(layout.widthMm-15)/(layout.heightMm-15);
  let best=null;
  for(let a=0;a<n-3;a++)for(let b=a+1;b<n-2;b++)for(let c=b+1;c<n-1;c++)for(let d=c+1;d<n;d++){
    const raw=[candidates[a],candidates[b],candidates[c],candidates[d]];
    const q=orderQuad(raw); if(!q)continue;
    const area=polygonArea(q),areaNorm=area/(w*h); if(areaNorm<.014)continue;
    const top=dist(q[0],q[1]),bottom=dist(q[3],q[2]),left=dist(q[0],q[3]),right=dist(q[1],q[2]);
    if(Math.min(top,bottom,left,right)<14)continue;
    const ratio=((top+bottom)/2)/((left+right)/2);
    if(ratio<expected*.28||ratio>expected*3.4)continue;
    const meanArea=raw.reduce((s,x)=>s+x.area,0)/4;
    const cv=Math.sqrt(raw.reduce((s,x)=>s+(x.area-meanArea)**2,0)/4)/Math.max(1,meanArea);
    const opposite=Math.abs(top-bottom)/(top+bottom)+Math.abs(left-right)/(left+right);
    const fillPenalty=raw.reduce((s,x)=>s+Math.abs(.85-x.fill),0)/4;
    const score=Math.abs(Math.log(ratio/expected))*2.1+cv*1.8+opposite*.55+fillPenalty*.25-areaNorm*.9;
    if(!best||score<best.score)best={points:q,score,areaNorm};
  }
  return best;
}

function solveLinear(A,b) {
  const n=b.length,M=A.map((row,i)=>[...row,b[i]]);
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let r=col+1;r<n;r++)if(Math.abs(M[r][col])>Math.abs(M[pivot][col]))pivot=r;
    if(Math.abs(M[pivot][col])<1e-10)throw new Error("Transformação inválida");
    [M[col],M[pivot]]=[M[pivot],M[col]];
    const p=M[col][col];
    for(let j=col;j<=n;j++)M[col][j]/=p;
    for(let r=0;r<n;r++){
      if(r===col)continue;
      const f=M[r][col];
      for(let j=col;j<=n;j++)M[r][j]-=f*M[col][j];
    }
  }
  return M.map(row=>row[n]);
}

function homography(src,dst) {
  const A=[],b=[];
  for(let i=0;i<4;i++){
    const{x,y}=src[i],u=dst[i].x,v=dst[i].y;
    A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);
    A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);
  }
  const h=solveLinear(A,b);
  return[h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1];
}

function mapH(H,x,y) {
  const z=H[6]*x+H[7]*y+H[8];
  return{x:(H[0]*x+H[1]*y+H[2])/z,y:(H[3]*x+H[4]*y+H[5])/z};
}

function bilinear(gray,w,h,x,y) {
  if(x<0||y<0||x>=w-1||y>=h-1)return 255;
  const x0=Math.floor(x),y0=Math.floor(y),dx=x-x0,dy=y-y0;
  const i=y0*w+x0;
  const a=gray[i],b=gray[i+1],c=gray[i+w],d=gray[i+w+1];
  return a*(1-dx)*(1-dy)+b*dx*(1-dy)+c*(1-dx)*dy+d*dx*dy;
}

function sampleBubble(gray,w,h,H,cx,cy) {
  const inner=[]; const background=[];
  const step=.34;
  for(let dy=-4.2;dy<=4.2;dy+=step)for(let dx=-4.2;dx<=4.2;dx+=step){
    const rr=Math.hypot(dx,dy);
    if(rr>4.2)continue;
    const p=mapH(H,cx+dx,cy+dy);
    const value=bilinear(gray,w,h,p.x,p.y);
    if(rr<=1.65)inner.push(value);
    else if(rr>=3.15&&rr<=4.15)background.push(value);
  }
  if(!inner.length||!background.length)return {score:0,coverage:0,contrast:0,innerMean:255,bgMean:255};
  const innerMean=inner.reduce((s,v)=>s+v,0)/inner.length;
  const bgMean=background.reduce((s,v)=>s+v,0)/background.length;
  const darkCut=bgMean-Math.max(15,bgMean*.065);
  const coverage=inner.filter(v=>v<darkCut).length/inner.length;
  const contrast=clamp((bgMean-innerMean)/100,0,1);
  const score=clamp(coverage*.68+contrast*.32,0,1);
  return {score,coverage,contrast,innerMean,bgMean};
}

function classifyQuestion(samples, letters, sensitivity) {
  const ranked=samples.map((x,i)=>({...x,i})).sort((a,b)=>b.score-a.score);
  const first=ranked[0],second=ranked[1]||{score:0,i:-1};
  const threshold=sensitivity;
  const gap=first.score-second.score;

  if(first.score<threshold*.58){
    return {detected:"",status:"blank",uncertain:false,confidence:1-clamp(first.score/Math.max(.001,threshold),0,1),scores:samples};
  }
  if(first.score<threshold){
    return {detected:letters[first.i],status:"review",uncertain:true,confidence:clamp(first.score/threshold,0,1)*.5,reason:"Marcação possivelmente fraca",scores:samples};
  }
  if(second.score>=threshold && second.score>=first.score*.66){
    return {detected:`${letters[first.i]}/${letters[second.i]}`,status:"multiple",uncertain:false,confidence:clamp(gap/.25,0,1),scores:samples};
  }
  if(second.score>=threshold*.7 && gap<.14){
    return {detected:letters[first.i],status:"review",uncertain:true,confidence:clamp(gap/.14,0,1),reason:"Duas alternativas muito parecidas",scores:samples};
  }
  if(first.score<threshold+.09){
    return {detected:letters[first.i],status:"review",uncertain:true,confidence:clamp((first.score-threshold)/.09,0,1)*.6+.2,reason:"Leitura com baixa confiança",scores:samples};
  }
  return {detected:letters[first.i],status:"marked",uncertain:false,confidence:clamp(.55+gap*.9+(first.score-threshold)*.7,0,1),scores:samples};
}

function drawDetectionOverlay(detection) {
  renderPhotoPreview();
  const sx=els.photoCanvas.width/detection.analysis.width,sy=els.photoCanvas.height/detection.analysis.height;
  const ctx=els.photoCanvas.getContext("2d");
  ctx.save();ctx.lineWidth=3;ctx.strokeStyle="#1e9d58";ctx.fillStyle="#1e9d58";
  const pts=detection.quad.points;
  ctx.beginPath();pts.forEach((p,i)=>{const x=p.x*sx,y=p.y*sy;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.stroke();
  pts.forEach(p=>ctx.fillRect(p.x*sx-5,p.y*sy-5,10,10));
  ctx.restore();
}



function adaptiveNormalize(gray,w,h){const integral=buildIntegral(gray,w,h),out=new Uint8Array(gray.length),radius=clamp(Math.round(Math.min(w,h)*.045),18,55);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,mean=rectMean(integral,w,h,x-radius,y-radius,x+radius+1,y+radius+1);out[i]=clamp(Math.round(132+(gray[i]-mean)*1.7),0,255)}return normalizeGray(out)}
function assessImageQuality(source){const a=getAnalysisImage(source,650);let sum=0,sum2=0,edge=0,count=0;for(let i=0;i<a.gray.length;i+=3){const v=a.gray[i];sum+=v;sum2+=v*v;count++}const mean=sum/count,std=Math.sqrt(Math.max(0,sum2/count-mean*mean));for(let y=1;y<a.height-1;y+=2)for(let x=1;x<a.width-1;x+=2){const i=y*a.width+x;edge+=Math.abs(a.gray[i]-a.gray[i-1])+Math.abs(a.gray[i]-a.gray[i-a.width])}const sharp=edge/Math.max(1,((a.width-2)*(a.height-2)/4)*2);let markerFound=false;const test=getSelectedTest();if(test){const layout=layoutFor(test.questionCount,test.alternativeCount);markerFound=!!chooseMarkerQuad(findDarkComponents(a.normalized,a.width,a.height),layout,a.width,a.height)}const warnings=[];if(mean<65)warnings.push("foto muito escura");else if(mean>244)warnings.push("foto muito clara");if(std<28)warnings.push("baixo contraste");if(sharp<5.3)warnings.push("possível desfoque");if(test&&!markerFound)warnings.push("4 marcas ainda não confirmadas");const level=warnings.length===0?"good":warnings.length<=2?"warn":"bad";return{mean,std,sharp,markerFound,warnings,level}}
function updatePhotoQuality(){if(!state.currentImageCanvas){state.currentQuality=null;els.qualityBox.className="quality-box neutral";els.qualityStatus.textContent="Aguardando imagem.";els.qualityDetails.innerHTML="";return}try{const q=assessImageQuality(state.currentImageCanvas);state.currentQuality=q;els.qualityBox.className=`quality-box ${q.level}`;els.qualityStatus.textContent=q.warnings.length?q.warnings.map(x=>x[0].toUpperCase()+x.slice(1)).join(" • "):"Imagem com boa qualidade para análise.";els.qualityDetails.innerHTML=`<span class="quality-chip">Luz ${Math.round(q.mean)}/255</span><span class="quality-chip">Contraste ${Math.round(q.std)}</span><span class="quality-chip">Nitidez ${formatNumber(q.sharp,1)}</span>${getSelectedTest()?`<span class="quality-chip">Marcas ${q.markerFound?"detectadas":"não confirmadas"}</span>`:""}`}catch(e){console.warn(e)}}
function setCurrentImageCanvas(canvas){if(els.studentId)els.studentId.value="";if(els.studentSeries)els.studentSeries.value="";if(typeof V16!=="undefined")V16.ocrSerial++;state.currentImageCanvas=canvas;state.lastDetection=null;state.currentResults=[];state.currentCorrectionId=null;els.imagePlaceholder.classList.add("hidden");els.photoCanvas.classList.remove("hidden");renderPhotoPreview();els.resultPanel.classList.add("hidden");els.analyzeBtn.disabled=!getSelectedTest();updatePhotoQuality()}
function scanSheet(source,test,sensitivity){const layout=layoutFor(test.questionCount,test.alternativeCount),analysis=getAnalysisImage(source);analysis.enhanced=adaptiveNormalize(analysis.gray,analysis.width,analysis.height);let candidates=findDarkComponents(analysis.normalized,analysis.width,analysis.height),quad=chooseMarkerQuad(candidates,layout,analysis.width,analysis.height),used="normal";if(!quad){candidates=findDarkComponents(analysis.enhanced,analysis.width,analysis.height);quad=chooseMarkerQuad(candidates,layout,analysis.width,analysis.height);used="enhanced"}if(!quad)throw new Error("Não encontrei as quatro marcas pretas. Mostre o gabarito inteiro, evite cortar os cantos e tente novamente.");const m=MODEL.markerInset+MODEL.markerSize/2,canon=[{x:m,y:m},{x:layout.widthMm-m,y:m},{x:layout.widthMm-m,y:layout.heightMm-m},{x:m,y:layout.heightMm-m}],H=homography(canon,quad.points),results=[];for(let c=0;c<layout.columns;c++)for(let r=0;r<layout.rowsPerColumn;r++){const qn=questionNumber(layout,c,r);if(qn>layout.questionCount)continue;const y=(layout.firstRowY??MODEL.firstRowY)+r*MODEL.rowPitch,origin=layout.columnOrigins[c];const samples=layout.bubbleXs.map(x=>{const a=sampleBubble(analysis.normalized,analysis.width,analysis.height,H,origin+x,y),b=sampleBubble(analysis.enhanced,analysis.width,analysis.height,H,origin+x,y);return b.score>a.score+.035?{...b,source:"enhanced"}:{...a,source:"normal"}});results.push({question:qn,...classifyQuestion(samples,layout.alternatives,sensitivity),manual:false})}return{layout,analysis,quad,H,results,used}}
function createSelfTest(){const test=getSelectedTest();if(!test)return setMessage(els.scanMessage,"Cadastre e selecione um gabarito primeiro.","error");const layout=layoutFor(test.questionCount,test.alternativeCount),scale=5,c=document.createElement("canvas");c.width=Math.round(layout.widthMm*scale);c.height=Math.round(layout.heightMm*scale);const ctx=c.getContext("2d",{willReadFrequently:true});ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);const fill=test.answers.map((a,i)=>test.annulled[i]?(a||alternativesFor(test.alternativeCount)[0]):a);drawSheet(canvasRenderer(ctx,scale),layout,fill);setCurrentImageCanvas(c);setMessage(els.scanMessage,"Imagem de autoteste criada com as respostas oficiais. Toque em Analisar gabarito.","ok")}


function summarizeResults(test,rows){let correct=0,wrong=0,blank=0,multiple=0,review=0,annulled=0,awarded=0,effectiveTotal=test.questionCount;rows.forEach((row,i)=>{if(test.annulled?.[i]){annulled++;if(test.annulledAwardPoint){awarded++;correct++}else effectiveTotal--;return}if(row.status==="review"){review++;return}if(row.status==="blank"){blank++;return}if(row.status==="multiple"){multiple++;return}if(row.detected===test.answers[i]){correct++;awarded++}else wrong++});effectiveTotal=Math.max(0,effectiveTotal);const percent=effectiveTotal?Math.round(awarded/effectiveTotal*100):100,grade=(Number(test.maxScore)||10)*percent/100,pending=review+multiple+blank;return{correct,wrong,blank,multiple,review,pending,annulled,percent,grade,awarded,effectiveTotal}}
function confidenceText(row){if(row.manual)return"Revisado manualmente";if(row.status==="review")return row.reason||"Leitura duvidosa";return`Confiança: ${Math.round(clamp(row.confidence||0,0,1)*100)}%`}
function reviewButtons(test,i){const wrap=document.createElement("div");wrap.className="manual-review";wrap.innerHTML="<span>Defina manualmente a resposta lida:</span>";alternativesFor(test.alternativeCount).forEach(letter=>{const b=document.createElement("button");b.type="button";b.className="review-btn";b.dataset.reviewIndex=i;b.dataset.reviewValue=letter;b.textContent=letter;wrap.appendChild(b)});for(const [value,label] of [["__blank","Em branco"],["__multiple","Dupla"]]){const b=document.createElement("button");b.type="button";b.className="review-btn wide";b.dataset.reviewIndex=i;b.dataset.reviewValue=value;b.textContent=label;wrap.appendChild(b)}return wrap}
function renderResults(test,rows,opts={}){state.activeResultTest=normalizeTest(test);state.currentResults=rows;const s=summarizeResults(test,rows);els.resultCorrect.textContent=s.correct;els.resultWrong.textContent=s.wrong;els.resultBlank.textContent=s.blank;els.resultMultiple.textContent=s.multiple;els.resultAnnulled.textContent=s.annulled;els.resultReview.textContent=s.pending;els.resultPercent.textContent=`${s.percent}%`;els.resultGrade.textContent=`${formatNumber(s.grade,2)} / ${formatNumber(test.maxScore,2)}`;els.resultRows.innerHTML="";rows.forEach((row,i)=>{const official=test.answers[i],isAnn=!!test.annulled?.[i];let cls="warn",note="";if(isAnn){cls="annulled";note=test.annulledAwardPoint?"Anulada • ponto concedido":"Anulada • fora do cálculo"}else if(row.status==="review"){cls="review";note=`Revisar • parece ${row.detected||"em branco"}`}else if(row.status==="blank"){cls="warn";note="Em branco"}else if(row.status==="multiple"){cls="warn";note="Marcação dupla"}else if(row.detected===official){cls="ok";note="Correta"}else{cls="wrong";note="Resposta errada"}
    const div=document.createElement("div");div.className=`result-row ${cls}`;div.dataset.index=i;const main=document.createElement("div");main.className="result-row-main";main.innerHTML=`<strong>${String(i+1).padStart(2,"0")}</strong><div class="answer-block"></div><span class="result-note"></span>`;main.querySelector(".result-note").textContent=note;const block=main.querySelector(".answer-block");
    if(isAnn)block.innerHTML=`<span class="annulled-label">Questão anulada</span><small class="confidence">${test.annulledAwardPoint?"Todos recebem o ponto.":"Não entra no cálculo."}</small>`;
    else if(cls==="wrong")block.innerHTML=`<div class="answer-comparison"><span class="marked-wrong">✕ Marcada: ${escapeHtml(row.detected||"—")}</span><span class="official-correct">✓ Correta: ${escapeHtml(official||"—")}</span></div><small class="confidence">${escapeHtml(confidenceText(row))}</small>`;
    else if(cls==="ok")block.innerHTML=`<span class="marked-correct">✓ Marcada: ${escapeHtml(row.detected)}</span><small class="confidence">${escapeHtml(confidenceText(row))}</small>`;
    else block.innerHTML=`<span class="result-answer">${escapeHtml(row.detected||"—")}</span><small class="confidence">${escapeHtml(confidenceText(row))}</small>`;div.appendChild(main);
    if(!isAnn){const details=document.createElement("details");details.className="manual-details";if(row.status==="review"||row.status==="multiple")details.open=true;details.innerHTML="<summary>Revisar/alterar leitura</summary>";details.appendChild(reviewButtons(test,i));div.appendChild(details)}els.resultRows.appendChild(div)});els.resultPanel.classList.remove("hidden");if(!opts.skipSave)autosaveCurrentCorrection(test);updateDataStats()}
function applyManualReview(index,value){const test=state.activeResultTest||getSelectedTest();const row=state.currentResults[index];if(!test||!row)return;if(value==="__blank"){row.detected="";row.status="blank"}else if(value==="__multiple"){row.detected="—";row.status="multiple"}else{row.detected=value;row.status="marked"}row.uncertain=false;row.manual=true;row.confidence=1;row.reason="";renderResults(test,state.currentResults);setMessage(els.scanMessage,`Questão ${index+1} revisada manualmente e salva.`,"ok")}
function autosaveCurrentCorrection(test){const summary=summarizeResults(test,state.currentResults),now=new Date().toISOString();if(!state.currentCorrectionId)state.currentCorrectionId=uid("correcao");const previous=state.history.find(x=>x.id===state.currentCorrectionId);const record={id:state.currentCorrectionId,testId:test.id,testName:test.name,studentId:els.studentId.value.trim(),studentSeries:els.studentSeries?.value.trim()||"",createdAt:previous?.createdAt||now,updatedAt:now,questionCount:test.questionCount,alternativeCount:test.alternativeCount,maxScore:test.maxScore,annulledAwardPoint:test.annulledAwardPoint,officialAnswers:[...test.answers],annulled:[...test.annulled],quality:state.currentQuality?{...state.currentQuality}:null,rows:state.currentResults.map(r=>({question:r.question,detected:r.detected,status:r.status,manual:!!r.manual,confidence:r.confidence||0,reason:r.reason||""})),summary};const idx=state.history.findIndex(x=>x.id===record.id);idx>=0?state.history[idx]=record:state.history.unshift(record);state.history.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));saveHistory();renderHistory();els.resultSavedBadge.textContent="Salvo automaticamente"}
function testFromHistory(item){return normalizeTest({id:item.testId,name:item.testName,questionCount:item.questionCount,alternativeCount:item.alternativeCount,answers:item.officialAnswers||[],annulled:item.annulled||[],maxScore:item.maxScore||10,annulledAwardPoint:item.annulledAwardPoint!==false})}
function renderHistory(){els.historyList.innerHTML="";els.historyEmpty.classList.toggle("hidden",state.history.length>0);state.history.slice(0,30).forEach(item=>{const card=document.createElement("div");card.className="history-item";const d=new Date(item.updatedAt||item.createdAt),s=item.summary||{};card.innerHTML=`<strong></strong><div class="history-meta">${escapeHtml(item.studentId||"Aluno não informado")}${item.studentSeries?` • ${escapeHtml(item.studentSeries)}`:""}<br>${Number.isNaN(d.getTime())?"":d.toLocaleString("pt-BR")}<br>${item.questionCount} questões • ${s.pending??((s.review||0)+(s.multiple||0)+(s.blank||0))} pendência${(s.pending??((s.review||0)+(s.multiple||0)+(s.blank||0)))===1?"":"s"}</div><div class="history-score">${s.correct||0} acertos • ${s.percent||0}% • Nota ${formatNumber(s.grade,2)}</div><div class="history-actions"><button class="mini-btn" data-history-action="view" data-id="${item.id}">Ver resultado</button><button class="mini-btn danger" data-history-action="delete" data-id="${item.id}">Excluir</button></div>`;card.querySelector("strong").textContent=item.testName||"Gabarito";els.historyList.appendChild(card)});updateDataStats()}
function viewHistory(id){const item=state.history.find(x=>x.id===id);if(!item)return;const test=testFromHistory(item);state.currentCorrectionId=item.id;state.currentResults=item.rows.map(r=>({...r}));els.studentId.value=item.studentId||"";if(els.studentSeries)els.studentSeries.value=item.studentSeries||"";if(state.tests.some(t=>t.id===item.testId)){els.scanTestSelect.value=item.testId;updateSelectedTestInfo()}renderResults(test,state.currentResults,{skipSave:true});els.resultSavedBadge.textContent="Resultado salvo";els.resultPanel.scrollIntoView({behavior:"smooth",block:"start"})}
function deleteHistory(id){if(!confirm("Excluir esta correção do histórico?"))return;state.history=state.history.filter(x=>x.id!==id);saveHistory();renderHistory()}


function csvCell(v){const s=String(v??"");return/[;\n\"]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function exportCurrentCsv(){const test=state.activeResultTest||getSelectedTest();if(!test||!state.currentResults.length)return alert("Nenhum resultado para exportar.");const s=summarizeResults(test,state.currentResults),rows=[["Gabarita V1.6"],["Prova",test.name],["Aluno",els.studentId.value.trim()||"Não identificado"],["Série/turma",els.studentSeries?.value.trim()||"Não identificada"],["Acertos",s.correct],["Erros",s.wrong],["Em branco",s.blank],["Duplas",s.multiple],["Pendências",s.pending],["Aproveitamento",`${s.percent}%`],["Nota",formatNumber(s.grade,2)],[],["Questão","Marcada","Correta","Status","Confiança","Revisão manual"]];state.currentResults.forEach((r,i)=>rows.push([i+1,r.detected||"",test.answers[i]||"",test.annulled[i]?"Anulada":r.status,Math.round((r.confidence||0)*100)+"%",r.manual?"Sim":"Não"]));const text="\ufeff"+rows.map(r=>r.map(csvCell).join(";")).join("\n");downloadBlob(new Blob([text],{type:"text/csv;charset=utf-8"}),`gabarita-${(test.name||"resultado").replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.csv`)}
function createTextPdfBytes(title,lines){const enc=new TextEncoder(),pageLines=45,chunks=[];for(let i=0;i<lines.length;i+=pageLines)chunks.push(lines.slice(i,i+pageLines));const objects=[null],pageIds=[],contentIds=[];objects.push(null);objects.push(null);let next=3;for(const chunk of chunks){pageIds.push(next++);contentIds.push(next++)}const fontId=next++,fontBoldId=next++;objects[fontId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';objects[fontBoldId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';chunks.forEach((chunk,p)=>{let y=800,cmd=`BT /F2 16 Tf 40 ${y} Td (${pdfEscapeText(title)}) Tj ET\n`;y-=26;for(const line of chunk){cmd+=`BT /F1 10 Tf 40 ${y} Td (${pdfEscapeText(line)}) Tj ET\n`;y-=15}objects[contentIds[p]]=`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`;objects[pageIds[p]]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentIds[p]} 0 R >>`});objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;let pdf='%PDF-1.4\n%Gabarita\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=enc.encode(pdf).length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`}const xref=enc.encode(pdf).length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return enc.encode(pdf)}
function exportCurrentPdf(){const test=state.activeResultTest||getSelectedTest();if(!test||!state.currentResults.length)return alert("Nenhum resultado para exportar.");const s=summarizeResults(test,state.currentResults),lines=[`Aluno: ${els.studentId.value.trim()||"Não identificado"}`,`Série/turma: ${els.studentSeries?.value.trim()||"Não identificada"}`,`Acertos: ${s.correct} | Erros: ${s.wrong} | Em branco: ${s.blank} | Duplas: ${s.multiple}`,`Anuladas: ${s.annulled} | Pendências: ${s.pending??(s.review+s.multiple+s.blank)} | Aproveitamento: ${s.percent}% | Nota: ${formatNumber(s.grade,2)} / ${formatNumber(test.maxScore,2)}`,""];state.currentResults.forEach((r,i)=>lines.push(`${String(i+1).padStart(2,"0")}  Marcada: ${r.detected||"-"}  Correta: ${test.answers[i]||"-"}  ${test.annulled[i]?"ANULADA":r.status}`));downloadBlob(new Blob([createTextPdfBytes(`Gabarita - ${test.name}`,lines)],{type:"application/pdf"}),`gabarita-resultado-${Date.now()}.pdf`)}
function exportHistoryCsv(){const rows=[["Data","Prova","Aluno","Série/turma","Acertos","Erros","Brancos","Duplas","Anuladas","Pendências","Aproveitamento","Nota"]];state.history.forEach(h=>{const s=h.summary||{};rows.push([new Date(h.updatedAt||h.createdAt).toLocaleString("pt-BR"),h.testName,h.studentId||"",h.studentSeries||"",s.correct||0,s.wrong||0,s.blank||0,s.multiple||0,s.annulled||0,s.pending||0,(s.percent||0)+"%",formatNumber(s.grade,2)])});downloadBlob(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(";")).join("\n")],{type:"text/csv;charset=utf-8"}),`gabarita-historico-${new Date().toISOString().slice(0,10)}.csv`)}
function exportBackup(){const data={app:"Gabarita",version:"1.4.0",exportedAt:new Date().toISOString(),tests:state.tests,history:state.history,settings:state.settings};downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),`gabarita-backup-${new Date().toISOString().slice(0,10)}.json`);setMessage(els.backupMessage,"Backup exportado.","ok")}
async function importBackupFile(file){if(!file)return;try{const data=JSON.parse(await file.text());if(data.app!=="Gabarita"||!Array.isArray(data.tests)||!Array.isArray(data.history))throw new Error("Arquivo incompatível");if(!confirm("Importar este backup e substituir os dados atuais do Gabarita?"))return;state.tests=data.tests.map(normalizeTest);state.history=data.history;state.settings={...state.settings,...(data.settings||{})};saveTests();saveHistory();saveSettings();restoreSettings();renderTests();renderHistory();setMessage(els.backupMessage,"Backup restaurado com sucesso.","ok")}catch(e){console.error(e);setMessage(els.backupMessage,"Não consegui importar este backup.","error")}}

function viewHistory(id){const item=state.history.find(x=>x.id===id);if(!item)return;const test=testFromHistory(item);state.currentReadOnly=false;state.currentCorrectionId=item.id;state.currentResults=(item.rows||[]).map(r=>({...r}));els.studentId.value=item.studentId||"";if(els.studentSeries)els.studentSeries.value=item.studentSeries||"";if(state.tests.some(t=>t.id===item.testId)){els.scanTestSelect.value=item.testId;updateSelectedTestInfo()}renderResults(test,state.currentResults,{skipSave:true,readOnly:false});els.resultSavedBadge.textContent="Resultado salvo";els.resultPanel.scrollIntoView({behavior:"smooth",block:"start"})}
function exportCurrentCsv(){const test=state.activeResultTest||getSelectedTest();if(!test||!state.currentResults.length)return alert("Nenhum resultado para exportar.");if(state.currentReadOnly){const rows=[["Gabarita V1.6 - Somente leitura"],["Prova",test.name],["Aluno",els.studentId.value.trim()||"Não identificado"],["Série/turma",els.studentSeries?.value.trim()||"Não identificada"],[],["Questão","Leitura","Status","Confiança","Revisão manual"]];state.currentResults.forEach((r,i)=>rows.push([i+1,r.detected||"",r.status,Math.round((r.confidence||0)*100)+"%",r.manual?"Sim":"Não"]));return downloadBlob(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(";")).join("\n")],{type:"text/csv;charset=utf-8"}),`gabarita-leitura-${Date.now()}.csv`)}const s=summarizeResults(test,state.currentResults),rows=[["Gabarita V1.6"],["Prova",test.name],["Turma",test.className||""],["Aluno",els.studentId.value.trim()||"Não identificado"],["Série/turma",els.studentSeries?.value.trim()||"Não identificada"],["Acertos",s.correct],["Erros",s.wrong],["Em branco",s.blank],["Duplas",s.multiple],["Pendências",s.pending],["Aproveitamento",`${s.percent}%`],["Nota",formatNumber(s.grade,2)],[],["Questão","Marcada","Correta","Status","Confiança","Revisão manual"]];state.currentResults.forEach((r,i)=>rows.push([i+1,r.detected||"",test.answers[i]||"",test.annulled[i]?"Anulada":r.status,Math.round((r.confidence||0)*100)+"%",r.manual?"Sim":"Não"]));downloadBlob(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(";")).join("\n")],{type:"text/csv;charset=utf-8"}),`gabarita-${(test.name||"resultado").replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.csv`)}
function exportCurrentPdf(){const test=state.activeResultTest||getSelectedTest();if(!test||!state.currentResults.length)return alert("Nenhum resultado para exportar.");if(state.currentReadOnly){const r=summarizeReadOnly(state.currentResults),lines=[`Aluno: ${els.studentId.value.trim()||"Não identificado"}`,`Série/turma: ${els.studentSeries?.value.trim()||"Não identificada"}`,`Marcadas: ${r.marked} | Em branco: ${r.blank} | Duplas: ${r.multiple} | Revisar: ${r.review}`,""];state.currentResults.forEach((x,i)=>lines.push(`${String(i+1).padStart(2,"0")}  Lida: ${x.detected||"-"}  ${x.status}`));return downloadBlob(new Blob([createTextPdfBytes(`Gabarita - Leitura - ${test.name}`,lines)],{type:"application/pdf"}),`gabarita-leitura-${Date.now()}.pdf`)}const sm=summarizeResults(test,state.currentResults),lines=[`Turma: ${test.className||"-"}`,`Aluno: ${els.studentId.value.trim()||"Não identificado"}`,`Série/turma: ${els.studentSeries?.value.trim()||"Não identificada"}`,`Acertos: ${sm.correct} | Erros: ${sm.wrong} | Em branco: ${sm.blank} | Duplas: ${sm.multiple}`,`Anuladas: ${sm.annulled} | Pendências: ${sm.pending??(sm.review+sm.multiple)} | Aproveitamento: ${sm.percent}% | Nota: ${formatNumber(sm.grade,2)} / ${formatNumber(test.maxScore,2)}`,""];state.currentResults.forEach((r,i)=>lines.push(`${String(i+1).padStart(2,"0")}  Marcada: ${r.detected||"-"}  Correta: ${test.answers[i]||"-"}  ${test.annulled[i]?"ANULADA":r.status}`));downloadBlob(new Blob([createTextPdfBytes(`Gabarita - ${test.name}`,lines)],{type:"application/pdf"}),`gabarita-resultado-${Date.now()}.pdf`)}

function updateDataStats(){if(els.dataStats)els.dataStats.textContent=`${state.tests.length} gabarito${state.tests.length===1?"":"s"} • ${state.history.length} correç${state.history.length===1?"ão":"ões"}`}
function clearHistory(){if(!state.history.length)return;if(!confirm("Apagar todo o histórico de correções? Os gabaritos cadastrados serão mantidos."))return;state.history=[];saveHistory();renderHistory()}
async function requestPersistentStorage(){try{if(!navigator.storage?.persist)return setMessage(els.installMessage,"Este navegador não oferece armazenamento persistente.","warn");const granted=await navigator.storage.persist();setMessage(els.installMessage,granted?"Armazenamento protegido pelo navegador.":"O navegador não concedeu armazenamento persistente.",granted?"ok":"warn")}catch{setMessage(els.installMessage,"Não foi possível solicitar armazenamento persistente.","error")}}
function updateOnlineStatus(){els.offlineStatus.textContent=navigator.onLine?"Online. Depois de instalado/carregado, o Gabarita também pode abrir sem internet.":"Offline. O Gabarita está usando os arquivos salvos no dispositivo."}


function startNextCorrection(){state.currentImageCanvas=null;state.currentResults=[];state.currentCorrectionId=null;state.lastDetection=null;state.currentQuality=null;state.activeResultTest=null;els.studentId.value="";els.photoCanvas.classList.add("hidden");els.imagePlaceholder.classList.remove("hidden");els.resultPanel.classList.add("hidden");els.analyzeBtn.disabled=true;updatePhotoQuality();setMessage(els.scanMessage,"Pronto para a próxima prova.","ok");if(els.sequenceMode.checked)openCamera()}
function analyzeCurrentImage(){const test=getSelectedTest();if(!test)return setMessage(els.scanMessage,"Cadastre e selecione um gabarito primeiro.","error");if(!state.currentImageCanvas)return setMessage(els.scanMessage,"Tire uma foto ou escolha uma imagem primeiro.","error");els.analyzeBtn.disabled=true;els.analyzeBtn.textContent="Analisando…";setMessage(els.scanMessage,"Melhorando iluminação, corrigindo perspectiva e lendo as marcações…");setTimeout(()=>{try{const sensitivity=Number(els.markSensitivity.value)/100,detection=scanSheet(state.currentImageCanvas,test,sensitivity);state.lastDetection=detection;state.currentCorrectionId=null;drawDetectionOverlay(detection);renderResults(test,detection.results);const review=detection.results.filter(x=>(x.status==="review"||x.status==="multiple")&&!test.annulled[x.question-1]).length;setMessage(els.scanMessage,review?`Análise concluída. ${review} ${review===1?"questão precisa":"questões precisam"} de conferência manual.`:"Gabarito analisado com alta confiança.",review?"warn":"ok");els.resultPanel.scrollIntoView({behavior:"smooth",block:"start"})}catch(err){console.error(err);renderPhotoPreview();els.resultPanel.classList.add("hidden");setMessage(els.scanMessage,err.message||"Não consegui analisar o gabarito.","error")}finally{els.analyzeBtn.disabled=false;els.analyzeBtn.textContent="Analisar gabarito"}},30)}
function switchView(name){els.views.forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));els.navButtons.forEach(b=>b.classList.toggle("active",b.dataset.view===name));state.settings.currentView=name;saveSettings();if(name==="generator")renderGenerator();if(name==="register")renderTests();if(name==="correct"){renderScanSelect();updateSelectedTestInfo();renderHistory()}if(name==="data")updateDataStats();window.scrollTo({top:0,behavior:"smooth"})}
function restoreSettings(){els.genQuestionCount.value=clampInt(state.settings.generatorQuestions,1,50,10);els.genAlternativeCount.value=clampInt(state.settings.generatorAlternatives,2,5,5);els.markSensitivity.value=clampInt(state.settings.sensitivity,18,55,30);els.sensitivityValue.textContent=`${els.markSensitivity.value}%`;els.sequenceMode.checked=!!state.settings.sequenceMode;els.studentId.value=state.settings.studentId||""}
function registerServiceWorker(){if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("service-worker.js").catch(e=>console.warn("SW",e))}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();state.deferredInstall=e;els.installAppBtn.disabled=false;setMessage(els.installMessage,"Gabarita pronto para instalação.","ok")});window.addEventListener("appinstalled",()=>{state.deferredInstall=null;els.installAppBtn.disabled=true;setMessage(els.installMessage,"Gabarita instalado.","ok")});
async function installApp(){if(!state.deferredInstall)return setMessage(els.installMessage,"A instalação ainda não foi oferecida pelo navegador. No iPhone, use Compartilhar → Adicionar à Tela de Início.","warn");state.deferredInstall.prompt();await state.deferredInstall.userChoice;state.deferredInstall=null;els.installAppBtn.disabled=true}



/* ========================= GABARITA V1.4 ========================= */
const V14 = Object.freeze({
  version: "1.4.0",
  minSheetConfidence: 0.56,
  minGridRatio: 0.48,
  minMarkerConfidence: 0.26,
  backupLimit: 6
});

Object.assign(els, {
  testClassName: $("testClassName"), readOnlyMode: $("readOnlyMode"), recognitionBox: $("recognitionBox"), recognitionStatus: $("recognitionStatus"), recognitionDetails: $("recognitionDetails"), reprocessBtn: $("reprocessBtn"), batchStatus: $("batchStatus"),
  readOnlySummary: $("readOnlySummary"), reviewOnlyBtn: $("reviewOnlyBtn"), historySearch: $("historySearch"), historyTestFilter: $("historyTestFilter"), historyPeriod: $("historyPeriod"), historyOnlyReview: $("historyOnlyReview"),
  statsTestSelect: $("statsTestSelect"), statsSummary: $("statsSummary"), questionStatsList: $("questionStatsList"), exportStatsCsvBtn: $("exportStatsCsvBtn"), restoreAutoBackupBtn: $("restoreAutoBackupBtn"),
  homeTestsCount: $("homeTestsCount"), homeCorrectionsCount: $("homeCorrectionsCount"), homePendingCount: $("homePendingCount"), homeLastCorrection: $("homeLastCorrection"), resultHelp: $("resultHelp")
});
Object.assign(state, {currentReadOnly:false,reviewOnlyFilter:false,batchCount:0,lastValidation:null});

function normalizeTest(t){
  const q=clampInt(t?.questionCount,1,50,10),a=clampInt(t?.alternativeCount,2,5,5),letters=alternativesFor(a);
  return {...t,id:t?.id||uid("gabarito"),name:t?.name||"Gabarito",className:String(t?.className||"").trim(),questionCount:q,alternativeCount:a,
    answers:Array.from({length:q},(_,i)=>letters.includes(t?.answers?.[i])?t.answers[i]:""),annulled:Array.from({length:q},(_,i)=>!!t?.annulled?.[i]),maxScore:Number(t?.maxScore)>0?Number(t.maxScore):10,
    annulledAwardPoint:t?.annulledAwardPoint!==false,createdAt:t?.createdAt||new Date().toISOString(),updatedAt:t?.updatedAt||new Date().toISOString()};
}
function loadTests(){return loadArray(STORAGE.tests,STORAGE.oldTests,STORAGE.olderTests,STORAGE.legacyTests).map(normalizeTest)}
function loadHistory(){return loadArray(STORAGE.history,STORAGE.oldHistory,STORAGE.olderHistory)}
function loadSettings(){const d={generatorQuestions:10,generatorAlternatives:5,sensitivity:30,selectedTestId:"",currentView:"home",sequenceMode:false,studentId:"",readOnlyMode:false,historySearch:"",historyTestFilter:"",historyPeriod:"all",historyOnlyReview:false,statsTestId:""};const older=safeParse(localStorage.getItem(STORAGE.olderSettings),{}),old=safeParse(localStorage.getItem(STORAGE.oldSettings),{});return{...d,...older,...old,...safeParse(localStorage.getItem(STORAGE.settings),{})}}

function snapshotBeforeDataWrite(reason="auto"){
  try{
    const tests=safeParse(localStorage.getItem(STORAGE.tests),null)??safeParse(localStorage.getItem(STORAGE.oldTests),[]);
    const history=safeParse(localStorage.getItem(STORAGE.history),null)??safeParse(localStorage.getItem(STORAGE.oldHistory),[]);
    const settings=safeParse(localStorage.getItem(STORAGE.settings),null)??safeParse(localStorage.getItem(STORAGE.oldSettings),{});
    if(!Array.isArray(tests)||!Array.isArray(history))return;
    const list=safeParse(localStorage.getItem(AUTO_BACKUP_KEY),[]);
    const signature=JSON.stringify([tests.length,history.length,tests.at(-1)?.updatedAt,history[0]?.updatedAt]);
    if(list[0]?.signature===signature)return;
    list.unshift({createdAt:new Date().toISOString(),reason,signature,tests,history,settings});
    localStorage.setItem(AUTO_BACKUP_KEY,JSON.stringify(list.slice(0,V14.backupLimit)));
  }catch(e){console.warn("Backup automático",e)}
}
function saveTests(){snapshotBeforeDataWrite("antes de alterar gabaritos");localStorage.setItem(STORAGE.tests,JSON.stringify(state.tests));updateHome();populateStatsSelects()}
function saveHistory(){snapshotBeforeDataWrite("antes de alterar histórico");localStorage.setItem(STORAGE.history,JSON.stringify(state.history));updateHome();populateStatsSelects();renderStatsDashboard()}

function restoreAutoBackup(){
  const list=safeParse(localStorage.getItem(AUTO_BACKUP_KEY),[]);if(!list.length)return setMessage(els.backupMessage,"Ainda não existe backup local anterior.","warn");
  const b=list[0],when=new Date(b.createdAt).toLocaleString("pt-BR");if(!confirm(`Restaurar o backup local de ${when}? Os dados atuais serão substituídos.`))return;
  state.tests=(b.tests||[]).map(normalizeTest);state.history=b.history||[];state.settings={...state.settings,...(b.settings||{})};
  localStorage.setItem(STORAGE.tests,JSON.stringify(state.tests));localStorage.setItem(STORAGE.history,JSON.stringify(state.history));localStorage.setItem(STORAGE.settings,JSON.stringify(state.settings));
  restoreSettings();renderTests();renderHistory();renderStatsDashboard();updateHome();setMessage(els.backupMessage,"Backup local anterior restaurado.","ok");
}

function renderTests(){
  els.testsList.innerHTML="";els.testsEmpty.classList.toggle("hidden",state.tests.length>0);
  state.tests.forEach(test=>{const card=document.createElement("article");card.className="test-card";const last=alternativesFor(test.alternativeCount).at(-1),annulled=test.annulled.filter(Boolean).length;
    card.innerHTML=`<h3></h3><div class="test-meta">${test.className?`<span class="badge">${escapeHtml(test.className)}</span>`:""}<span class="badge">${test.questionCount} questões</span><span class="badge">A–${last}</span><span class="badge">Nota ${formatNumber(test.maxScore,1)}</span>${annulled?`<span class="badge">${annulled} anulada${annulled>1?"s":""}</span>`:""}</div><div class="card-actions"><button class="btn primary" data-action="correct" data-id="${test.id}">Corrigir</button><button class="btn secondary" data-action="edit" data-id="${test.id}">Editar</button><button class="btn secondary" data-action="duplicate" data-id="${test.id}">Duplicar</button><button class="btn danger" data-action="delete" data-id="${test.id}">Excluir</button></div>`;
    card.querySelector("h3").textContent=test.name;els.testsList.appendChild(card)});renderScanSelect();updateDataStats();populateStatsSelects();updateHome();
}
function openEditor(test=null){state.editingId=test?.id||null;els.editorPanel.classList.remove("hidden");els.editorTitle.textContent=test?"Editar gabarito":"Novo gabarito";els.testName.value=test?.name||"";if(els.testClassName)els.testClassName.value=test?.className||"";els.testQuestionCount.value=test?.questionCount||10;els.testAlternativeCount.value=test?.alternativeCount||5;els.testMaxScore.value=test?.maxScore??10;els.annulledAwardPoint.checked=test?.annulledAwardPoint!==false;state.draftAnswers=test?.answers?[...test.answers]:Array(10).fill("");state.draftAnnulled=test?.annulled?[...test.annulled]:Array(state.draftAnswers.length).fill(false);renderAnswerGrid(true);els.editorPanel.scrollIntoView({behavior:"smooth",block:"start"})}
function saveCurrentTest(){const name=els.testName.value.trim(),className=els.testClassName?.value.trim()||"",q=clampInt(els.testQuestionCount.value,1,50,10),a=clampInt(els.testAlternativeCount.value,2,5,5),maxScore=Number(String(els.testMaxScore.value).replace(",","."));if(!name)return setMessage(els.editorMessage,"Digite o nome da prova.","error");if(!(maxScore>0))return setMessage(els.editorMessage,"Informe uma nota máxima válida.","error");if(state.draftAnswers.length!==q||state.draftAnswers.some((x,i)=>!state.draftAnnulled[i]&&!x))return setMessage(els.editorMessage,"Marque a resposta correta de todas as questões não anuladas.","error");const existing=state.tests.find(x=>x.id===state.editingId);const obj=normalizeTest({id:state.editingId||uid("gabarito"),name,className,questionCount:q,alternativeCount:a,answers:[...state.draftAnswers],annulled:[...state.draftAnnulled],maxScore,annulledAwardPoint:els.annulledAwardPoint.checked,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});const idx=state.tests.findIndex(x=>x.id===obj.id);idx>=0?state.tests[idx]=obj:state.tests.push(obj);saveTests();renderTests();closeEditor();switchView("register")}
function updateSelectedTestInfo(){const t=getSelectedTest();state.settings.selectedTestId=t?.id||"";saveSettings();if(!t){els.selectedTestInfo.textContent="Nenhum gabarito cadastrado.";els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;return}const last=alternativesFor(t.alternativeCount).at(-1),ann=t.annulled.filter(Boolean).length;els.selectedTestInfo.innerHTML=`<strong>${escapeHtml(t.name)}</strong>${t.className?`<br>Turma: ${escapeHtml(t.className)}`:""}<br>${t.questionCount} questões • A–${last} • Nota ${formatNumber(t.maxScore,1)}${ann?` • ${ann} anulada${ann>1?"s":""}`:""}`;els.analyzeBtn.disabled=!state.currentImageCanvas;els.reprocessBtn.disabled=!state.currentImageCanvas;if(state.currentImageCanvas)updatePhotoQuality()}

/* Gabarita 1.7.1 — medição do NÚCLEO de tinta, sem confundir a circunferência impressa com preenchimento.
   A leitura calcula o centro (raio 1.18 mm), deliberadamente distante da borda de raio 2.5 mm. */
function sampleBubble(gray,w,h,H,cx,cy){
  const core=[],reference=[],ring=[];
  // grade simétrica: evita viés de amostrar mais de um lado da circunferência.
  for(let iy=-24;iy<=24;iy++)for(let ix=-24;ix<=24;ix++){
    const dx=ix*.20,dy=iy*.20,r=Math.hypot(dx,dy);
    if(r>4.6)continue;
    const p=mapH(H,cx+dx,cy+dy),v=bilinear(gray,w,h,p.x,p.y);
    if(r<=1.18)core.push(v);
    else if(r>=2.13&&r<=2.87)ring.push(v);
    else if(r>=3.4&&r<=4.5)reference.push(v);
  }
  if(!core.length||!reference.length)return {score:0,coverage:0,contrast:0,centerDifference:0,innerMean:255,bgMean:255,ringMean:255};
  const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
  // fundo local elimina diferenças gerais de luminosidade na própria folha.
  const bgMean=mean(reference),innerMean=mean(core),ringMean=ring.length?mean(ring):bgMean;
  const centerDifference=bgMean-innerMean,cut=Math.max(20,bgMean*.085);
  const coverage=core.filter(v=>bgMean-v>=cut).length/core.length;
  const contrast=clamp(centerDifference/108,0,1);
  const score=clamp(.59*coverage+.41*contrast,0,1);
  return {score,coverage,contrast,centerDifference,innerMean,bgMean,ringMean,outline:clamp((bgMean-ringMean)/55,0,1)};
}
function chooseBubbleEvidence(raw,normal,enhanced){
  // Normalização adaptativa não cria tinta: requer-se evidência no sinal original ou no normalizado.
  const strongRaw=raw.centerDifference>=9&&raw.coverage>=.13;
  const strongNormal=normal.centerDifference>=14&&normal.coverage>=.20;
  if(!strongRaw&&!strongNormal)return {...normal,score:0,coverage:0,contrast:0,centerDifference:0,source:'sem tinta no centro'};
  const preferred=enhanced.score>normal.score+.095&&strongRaw?enhanced:normal;
  // Limita uma melhora artificial feita pelo realce, especialmente nas bolinhas vazias.
  const score=clamp(preferred.score,0,Math.max(normal.score+.12,raw.score+.23));
  return {...preferred,score,source:preferred===enhanced?'realce':'normal',rawContrast:raw.centerDifference};
}
function classifyQuestion(samples,letters,sensitivity){
  const ranked=samples.map((x,i)=>({...x,i})).sort((a,b)=>b.score-a.score);
  const first=ranked[0],second=ranked[1]||{score:0,coverage:0,contrast:0,i:-1},gap=first.score-second.score;
  const threshold=clamp(Number(sensitivity)||.30,.18,.55);
  const solid=x=>x.score>=threshold+.065&&x.coverage>=.42&&x.contrast>=.22&&x.centerDifference>=21;
  const strong=x=>x.score>=threshold+.015&&x.coverage>=.35&&x.contrast>=.18&&x.centerDifference>=17;
  const faint=x=>x.score>=Math.max(.20,threshold*.80)&&x.coverage>=.25&&x.contrast>=.13&&x.centerDifference>=14;
  const blank={detected:'',status:'blank',uncertain:false,confidence:clamp(1-first.score/Math.max(threshold,.30),.35,1),scores:samples};
  // DUPLA: duas evidências independentes fortes, não contorno/ruído da vizinha.
  if(solid(first)&&solid(second)&&second.score>=first.score*.70){
    return {detected:`${letters[first.i]}/${letters[second.i]}`,status:'multiple',uncertain:false,confidence:.82,scores:samples};
  }
  // Uma possível marca fraca SEM separação das outras é folha em branco, não "suspeita".
  if(!faint(first)||first.score<threshold*.80||gap<.11&&first.score<threshold+.07)return blank;
  if(strong(first)&&gap>=.10){
    return {detected:letters[first.i],status:'marked',uncertain:false,confidence:clamp(.73+gap*.33,0,1),scores:samples};
  }
  if(faint(first)&&gap>=.12){
    return {detected:letters[first.i],status:'review',uncertain:true,confidence:.43,reason:'Possível marcação fraca — confira',scores:samples};
  }
  if(strong(first)){
    return {detected:letters[first.i],status:'review',uncertain:true,confidence:.50,reason:'Preenchimento pouco distinto — confira',scores:samples};
  }
  return blank;
}

function sampleCanonicalMean(gray,w,h,H,cx,cy,r=.32){let sum=0,n=0;for(let dy=-r;dy<=r;dy+=.22)for(let dx=-r;dx<=r;dx+=.22){const p=mapH(H,cx+dx,cy+dy);sum+=bilinear(gray,w,h,p.x,p.y);n++}return n?sum/n:255}
function bubbleStructure(gray,w,h,H,cx,cy){
  let ring=0,out=0,center=0,nr=0,no=0,nc=0,sectors=0,sectorHits=0;
  for(let ang=0;ang<Math.PI*2;ang+=Math.PI/12){let rs=0,os=0,rn=0,on=0;for(const rr of [2.2,2.45,2.7,2.9]){const p=mapH(H,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr),v=bilinear(gray,w,h,p.x,p.y);ring+=v;nr++;rs+=v;rn++}for(const rr of [3.75,4.15,4.5]){const p=mapH(H,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr),v=bilinear(gray,w,h,p.x,p.y);out+=v;no++;os+=v;on++}sectors++;if((os/on)-(rs/rn)>8)sectorHits++}
  for(let dy=-1.2;dy<=1.2;dy+=.6)for(let dx=-1.2;dx<=1.2;dx+=.6){if(Math.hypot(dx,dy)>1.35)continue;const p=mapH(H,cx+dx,cy+dy);center+=bilinear(gray,w,h,p.x,p.y);nc++}
  const rm=ring/Math.max(1,nr),om=out/Math.max(1,no),cm=center/Math.max(1,nc),outline=om-rm,fill=om-cm,sectorRatio=sectorHits/Math.max(1,sectors);
  const score=clamp(Math.max(sectorRatio,outline/45,fill/82),0,1),valid=sectorRatio>=.58||(fill>45&&outline>5);
  return{outline,fill,sectorRatio,score,valid};
}
function validateBorder(gray,w,h,H,layout){
  let hits=0,total=0,strength=0;const inset=MODEL.outerInset,steps=14;
  for(let i=1;i<steps;i++){const t=i/steps;if(t<.08||t>.92)continue;for(const [x,y,nx,ny] of [[layout.widthMm*t,inset,layout.widthMm*t,inset+2],[layout.widthMm*t,layout.heightMm-inset,layout.widthMm*t,layout.heightMm-inset-2],[inset,layout.heightMm*t,inset+2,layout.heightMm*t],[layout.widthMm-inset,layout.heightMm*t,layout.widthMm-inset-2,layout.heightMm*t]]){const line=sampleCanonicalMean(gray,w,h,H,x,y,.42),near=sampleCanonicalMean(gray,w,h,H,nx,ny,.42),d=near-line;total++;if(line<185&&d>4)hits++;strength+=clamp(d/42,0,1)}}
  return{ratio:hits/Math.max(1,total),score:clamp((hits/Math.max(1,total))*.7+(strength/Math.max(1,total))*.3,0,1)};
}
function validateGrid(gray,w,h,H,layout){
  const structs=[];let seen=0;for(let c=0;c<layout.columns;c++)for(let r=0;r<layout.rowsPerColumn;r++){const qn=questionNumber(layout,c,r);if(qn>layout.questionCount)continue;const y=(layout.firstRowY??MODEL.firstRowY)+r*MODEL.rowPitch,origin=layout.columnOrigins[c];for(const x of layout.bubbleXs){const st=bubbleStructure(gray,w,h,H,origin+x,y);structs.push(st);if(st.valid)seen++}}
  const ratio=seen/Math.max(1,structs.length),avg=structs.reduce((s,x)=>s+x.score,0)/Math.max(1,structs.length);return{ratio,avg,score:clamp(ratio*.72+avg*.28,0,1),count:structs.length};
}
function validateSheetStructure(analysis,H,layout,quad){
  const gridA=validateGrid(analysis.normalized,analysis.width,analysis.height,H,layout),gridB=validateGrid(analysis.enhanced,analysis.width,analysis.height,H,layout),grid=gridB.score>gridA.score?gridB:gridA;
  const borderA=validateBorder(analysis.normalized,analysis.width,analysis.height,H,layout),borderB=validateBorder(analysis.enhanced,analysis.width,analysis.height,H,layout),border=borderB.score>borderA.score?borderB:borderA;
  const marker=clamp(quad.confidence??(1-(quad.score||1)/2.5),0,1),overall=clamp(marker*.40+grid.score*.47+border.score*.13,0,1);
  const valid=marker>=V14.minMarkerConfidence&&grid.ratio>=V14.minGridRatio&&overall>=V14.minSheetConfidence;
  const reasons=[];if(marker<V14.minMarkerConfidence)reasons.push("marcas de canto incompatíveis");if(grid.ratio<V14.minGridRatio)reasons.push("grade de bolinhas não corresponde ao modelo");if(overall<V14.minSheetConfidence)reasons.push("confiança geral insuficiente");
  return{valid,overall,marker,grid,border,reasons};
}
function chooseMarkerQuad(candidates,layout,w,h){
  const n=Math.min(candidates.length,24);if(n<4)return null;const expected=(layout.widthMm-15)/(layout.heightMm-15);let best=null;
  for(let a=0;a<n-3;a++)for(let b=a+1;b<n-2;b++)for(let c=b+1;c<n-1;c++)for(let d=c+1;d<n;d++){
    const raw=[candidates[a],candidates[b],candidates[c],candidates[d]];if(raw.some(x=>x.w/x.h<.56||x.w/x.h>1.78))continue;const q=orderQuad(raw);if(!q)continue;const area=polygonArea(q),areaNorm=area/(w*h);if(areaNorm<.014)continue;
    const top=dist(q[0],q[1]),bottom=dist(q[3],q[2]),left=dist(q[0],q[3]),right=dist(q[1],q[2]);if(Math.min(top,bottom,left,right)<14)continue;const ratio=((top+bottom)/2)/((left+right)/2);if(ratio<expected*.30||ratio>expected*3.0)continue;
    const meanArea=raw.reduce((s,x)=>s+x.area,0)/4,cv=Math.sqrt(raw.reduce((s,x)=>s+(x.area-meanArea)**2,0)/4)/Math.max(1,meanArea),opposite=Math.abs(top-bottom)/(top+bottom)+Math.abs(left-right)/(left+right),fillPenalty=raw.reduce((s,x)=>s+Math.abs(.85-x.fill),0)/4,ratioError=Math.abs(Math.log(ratio/expected));
    const sx=((top+bottom)/2)/(layout.widthMm-15),sy=((left+right)/2)/(layout.heightMm-15),expectedMarkerPx=MODEL.markerSize*Math.sqrt(Math.max(.01,sx*sy)),meanMarkerPx=raw.reduce((sum,x)=>sum+(x.w+x.h)/2,0)/4,markerSizeRatio=meanMarkerPx/Math.max(1,expectedMarkerPx);if(markerSizeRatio<.34||markerSizeRatio>2.55)continue;const markerSizeError=Math.abs(Math.log(markerSizeRatio));
    const score=ratioError*2.15+cv*1.9+opposite*.72+fillPenalty*.28+markerSizeError*.72-areaNorm*.8,confidence=clamp(1-(ratioError/1.1+cv/1.15+opposite/.85+fillPenalty/1.8+markerSizeError/1.0)/5,0,1);
    if(!best||score<best.score)best={points:q,score,areaNorm,confidence,metrics:{ratioError,cv,opposite,fillPenalty,markerSizeRatio}};
  }return best;
}
function scanSheet(source,test,sensitivity){
  const layout=layoutFor(test.questionCount,test.alternativeCount),analysis=getAnalysisImage(source);analysis.enhanced=adaptiveNormalize(analysis.gray,analysis.width,analysis.height);
  let candidates=findDarkComponents(analysis.normalized,analysis.width,analysis.height),quad=chooseMarkerQuad(candidates,layout,analysis.width,analysis.height),used="normal";if(!quad){candidates=findDarkComponents(analysis.enhanced,analysis.width,analysis.height);quad=chooseMarkerQuad(candidates,layout,analysis.width,analysis.height);used="enhanced"}
  if(!quad)throw new Error("Gabarito não reconhecido: não encontrei as quatro marcas pretas do modelo.");
  const m=MODEL.markerInset+MODEL.markerSize/2,canon=[{x:m,y:m},{x:layout.widthMm-m,y:m},{x:layout.widthMm-m,y:layout.heightMm-m},{x:m,y:layout.heightMm-m}],H=homography(canon,quad.points),validation=validateSheetStructure(analysis,H,layout,quad);
  if(!validation.valid){const e=new Error(`Imagem inválida — o padrão do Gabarita não foi confirmado${validation.reasons.length?`: ${validation.reasons.join(", ")}`:""}.`);e.validation=validation;throw e}
  const results=[];for(let c=0;c<layout.columns;c++)for(let r=0;r<layout.rowsPerColumn;r++){const qn=questionNumber(layout,c,r);if(qn>layout.questionCount)continue;const y=(layout.firstRowY??MODEL.firstRowY)+r*MODEL.rowPitch,origin=layout.columnOrigins[c];const samples=layout.bubbleXs.map(x=>{const a=sampleBubble(analysis.normalized,analysis.width,analysis.height,H,origin+x,y),b=sampleBubble(analysis.enhanced,analysis.width,analysis.height,H,origin+x,y),raw=sampleBubble(analysis.gray,analysis.width,analysis.height,H,origin+x,y);return chooseBubbleEvidence(raw,a,b)});results.push({question:qn,...classifyQuestion(samples,layout.alternatives,sensitivity),manual:false})}
  return{layout,analysis,quad,H,results,used,validation};
}

function showRecognition(validation=null,error=false){
  if(!els.recognitionBox)return;if(!validation){els.recognitionBox.className="recognition-box neutral";els.recognitionStatus.textContent="Aguardando análise.";els.recognitionDetails.innerHTML="";return}
  const pct=Math.round(validation.overall*100);els.recognitionBox.className=`recognition-box ${error||!validation.valid?"bad":pct>=78?"good":"warn"}`;els.recognitionStatus.textContent=validation.valid?`Gabarito reconhecido • ${pct}% de confiança`:`Modelo não confirmado • ${pct}% de confiança`;
  els.recognitionDetails.innerHTML=`<span class="quality-chip">Marcas ${Math.round(validation.marker*100)}%</span><span class="quality-chip">Grade ${Math.round(validation.grid.ratio*100)}%</span><span class="quality-chip">Borda ${Math.round(validation.border.score*100)}%</span>`;
}
function setCurrentImageCanvas(canvas){state.currentImageCanvas=canvas;state.lastDetection=null;state.currentResults=[];state.currentCorrectionId=null;state.lastValidation=null;els.imagePlaceholder.classList.add("hidden");els.photoCanvas.classList.remove("hidden");renderPhotoPreview();els.resultPanel.classList.add("hidden");els.analyzeBtn.disabled=!getSelectedTest();els.reprocessBtn.disabled=!getSelectedTest();showRecognition();updatePhotoQuality()}

function summarizeReadOnly(rows){let marked=0,blank=0,multiple=0,review=0;rows.forEach(r=>{if(r.status==="blank")blank++;else if(r.status==="multiple")multiple++;else if(r.status==="review")review++;else marked++});return{marked,blank,multiple,review}}
function renderResultsV151(test,rows,opts={}){
  const readOnly=opts.readOnly??state.currentReadOnly;state.currentReadOnly=!!readOnly;state.activeResultTest=normalizeTest(test);state.currentResults=rows;state.reviewOnlyFilter=false;els.reviewOnlyBtn.textContent="Mostrar pendências";
  els.resultRows.innerHTML="";els.resultSavedBadge.textContent=readOnly?"Somente leitura":"Salvo automaticamente";els.resultHelp.textContent=readOnly?"Modo somente leitura: confira o que o scanner entendeu antes de comparar.":"Pendências incluem leituras duvidosas e marcações duplas; confira antes de finalizar.";
  const summaryBox=els.resultPanel.querySelector(".result-summary");summaryBox.classList.toggle("hidden",readOnly);els.readOnlySummary.classList.toggle("hidden",!readOnly);
  if(readOnly){const r=summarizeReadOnly(rows);els.readOnlySummary.innerHTML=`<div><span>Marcadas</span><strong>${r.marked}</strong></div><div><span>Em branco</span><strong>${r.blank}</strong></div><div><span>Duplas</span><strong>${r.multiple}</strong></div><div><span>Revisar</span><strong>${r.review}</strong></div>`}
  else{const s=summarizeResults(test,rows);els.resultCorrect.textContent=s.correct;els.resultWrong.textContent=s.wrong;els.resultBlank.textContent=s.blank;els.resultMultiple.textContent=s.multiple;els.resultAnnulled.textContent=s.annulled;els.resultReview.textContent=s.pending;els.resultPercent.textContent=`${s.percent}%`;els.resultGrade.textContent=`${formatNumber(s.grade,2)} / ${formatNumber(test.maxScore,2)}`}
  rows.forEach((row,i)=>{const official=test.answers[i],isAnn=!!test.annulled?.[i];let cls="warn",note="";
    if(readOnly){if(row.status==="review"){cls="review";note="Revisar leitura"}else if(row.status==="blank"){cls="warn";note="Em branco"}else if(row.status==="multiple"){cls="warn";note="Duas marcações confirmadas"}else{cls="ok";note="Leitura clara"}}
    else if(isAnn){cls="annulled";note=test.annulledAwardPoint?"Anulada • ponto concedido":"Anulada • fora do cálculo"}else if(row.status==="review"){cls="review";note=`Revisar • parece ${row.detected||"em branco"}`}else if(row.status==="blank"){cls="warn";note="Em branco"}else if(row.status==="multiple"){cls="warn";note="Marcação dupla confirmada"}else if(row.detected===official){cls="ok";note="Correta"}else{cls="wrong";note="Resposta errada"}
    const div=document.createElement("div");div.className=`result-row ${cls}`;div.dataset.index=i;div.dataset.status=row.status;const main=document.createElement("div");main.className="result-row-main";main.innerHTML=`<strong>${String(i+1).padStart(2,"0")}</strong><div class="answer-block"></div><span class="result-note"></span>`;main.querySelector(".result-note").textContent=note;const block=main.querySelector(".answer-block");
    if(readOnly)block.innerHTML=`<span class="${row.status==="marked"?"marked-correct":"result-answer"}">Lida: ${escapeHtml(row.detected||"—")}</span><small class="confidence">${escapeHtml(confidenceText(row))}</small>`;
    else if(isAnn)block.innerHTML=`<span class="annulled-label">Questão anulada</span><small class="confidence">${test.annulledAwardPoint?"Todos recebem o ponto.":"Não entra no cálculo."}</small>`;
    else if(cls==="wrong")block.innerHTML=`<div class="answer-comparison"><span class="marked-wrong">✕ Marcada: ${escapeHtml(row.detected||"—")}</span><span class="official-correct">✓ Correta: ${escapeHtml(official||"—")}</span></div><small class="confidence">${escapeHtml(confidenceText(row))}</small>`;
    else if(cls==="ok")block.innerHTML=`<span class="marked-correct">✓ Marcada: ${escapeHtml(row.detected)}</span><small class="confidence">${escapeHtml(confidenceText(row))}</small>`;
    else block.innerHTML=`<span class="result-answer">${escapeHtml(row.detected||"—")}</span><small class="confidence">${escapeHtml(confidenceText(row))}</small>`;div.appendChild(main);
    if(!isAnn){const details=document.createElement("details");details.className="manual-details";if(row.status==="review"||row.status==="multiple")details.open=true;details.innerHTML="<summary>Revisar/alterar leitura</summary>";details.appendChild(reviewButtons(test,i));div.appendChild(details)}els.resultRows.appendChild(div)
  });els.resultPanel.classList.remove("hidden");applyReviewFilter();if(!readOnly&&!opts.skipSave)autosaveCurrentCorrection(test);updateDataStats();
}
function applyReviewFilter(){if(!els.reviewOnlyBtn)return;els.resultRows.classList.toggle("review-only",state.reviewOnlyFilter);els.reviewOnlyBtn.textContent=state.reviewOnlyFilter?"Mostrar todas":"Mostrar pendências"}
function toggleReviewOnly(){state.reviewOnlyFilter=!state.reviewOnlyFilter;applyReviewFilter();if(state.reviewOnlyFilter){const first=els.resultRows.querySelector('.result-row[data-status="review"], .result-row[data-status="multiple"]');first?.scrollIntoView({behavior:"smooth",block:"center"})}}

function autosaveCurrentCorrection(test){const isNew=!state.currentCorrectionId,summary=summarizeResults(test,state.currentResults),now=new Date().toISOString();if(!state.currentCorrectionId)state.currentCorrectionId=uid("correcao");const previous=state.history.find(x=>x.id===state.currentCorrectionId);const record={id:state.currentCorrectionId,testId:test.id,testName:test.name,className:test.className||"",studentId:els.studentId.value.trim(),studentSeries:els.studentSeries?.value.trim()||"",createdAt:previous?.createdAt||now,updatedAt:now,questionCount:test.questionCount,alternativeCount:test.alternativeCount,maxScore:test.maxScore,annulledAwardPoint:test.annulledAwardPoint,officialAnswers:[...test.answers],annulled:[...test.annulled],quality:state.currentQuality?{...state.currentQuality}:null,validation:state.lastValidation?{overall:state.lastValidation.overall,marker:state.lastValidation.marker,grid:state.lastValidation.grid,border:state.lastValidation.border}:null,rows:state.currentResults.map(r=>({question:r.question,detected:r.detected,status:r.status,manual:!!r.manual,confidence:r.confidence||0,reason:r.reason||""})),summary};const idx=state.history.findIndex(x=>x.id===record.id);idx>=0?state.history[idx]=record:state.history.unshift(record);state.history.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));if(isNew)state.batchCount++;saveHistory();renderHistory();updateBatchStatus();els.resultSavedBadge.textContent="Salvo automaticamente"}
function testFromHistory(item){return normalizeTest({id:item.testId,name:item.testName,className:item.className||"",questionCount:item.questionCount,alternativeCount:item.alternativeCount,answers:item.officialAnswers||[],annulled:item.annulled||[],maxScore:item.maxScore||10,annulledAwardPoint:item.annulledAwardPoint!==false})}

function populateHistoryFilters(){
  const current=els.historyTestFilter?.value||state.settings.historyTestFilter||"";if(els.historyTestFilter){els.historyTestFilter.innerHTML='<option value="">Todas as provas</option>';state.tests.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=t.name+(t.className?` • ${t.className}`:"");els.historyTestFilter.appendChild(o)});els.historyTestFilter.value=state.tests.some(t=>t.id===current)?current:""}
}
function filteredHistory(){const q=(els.historySearch?.value||"").trim().toLocaleLowerCase("pt-BR"),testId=els.historyTestFilter?.value||"",period=els.historyPeriod?.value||"all",onlyReview=!!els.historyOnlyReview?.checked,now=Date.now();return state.history.filter(item=>{if(testId&&item.testId!==testId)return false;if(onlyReview&&!(((item.summary?.pending??((item.summary?.review||0)+(item.summary?.multiple||0)+(item.summary?.blank||0)))>0)))return false;if(q&&!`${item.testName||""} ${item.className||""} ${item.studentId||""} ${item.studentSeries||""}`.toLocaleLowerCase("pt-BR").includes(q))return false;if(period!=="all"){const t=new Date(item.updatedAt||item.createdAt).getTime();if(period==="today"){const d=new Date();d.setHours(0,0,0,0);if(t<d.getTime())return false}else if(period==="7d"&&now-t>7*86400000)return false}return true})}
function renderHistory(){populateHistoryFilters();els.historyList.innerHTML="";const items=filteredHistory();els.historyEmpty.classList.toggle("hidden",items.length>0);els.historyEmpty.textContent=state.history.length&&!items.length?"Nenhuma correção corresponde aos filtros.":"Nenhuma correção salva ainda.";items.slice(0,60).forEach(item=>{const card=document.createElement("div");card.className="history-item";const d=new Date(item.updatedAt||item.createdAt),s=item.summary||{};card.innerHTML=`<strong></strong><div class="history-meta">${item.className?`Turma: ${escapeHtml(item.className)}<br>`:""}${escapeHtml(item.studentId||"Aluno não informado")}${item.studentSeries?` • ${escapeHtml(item.studentSeries)}`:""}<br>${Number.isNaN(d.getTime())?"":d.toLocaleString("pt-BR")}<br>${item.questionCount} questões • ${s.pending??((s.review||0)+(s.multiple||0)+(s.blank||0))} pendência${(s.pending??((s.review||0)+(s.multiple||0)+(s.blank||0)))===1?"":"s"}</div><div class="history-score">${s.correct||0} acertos • ${s.percent||0}% • Nota ${formatNumber(s.grade,2)}</div><div class="history-actions"><button class="mini-btn" data-history-action="view" data-id="${item.id}">Ver resultado</button><button class="mini-btn danger" data-history-action="delete" data-id="${item.id}">Excluir</button></div>`;card.querySelector("strong").textContent=item.testName||"Gabarito";els.historyList.appendChild(card)});updateDataStats();updateHome()}

function populateStatsSelects(){if(!els.statsTestSelect)return;const current=els.statsTestSelect.value||state.settings.statsTestId||"";els.statsTestSelect.innerHTML='<option value="">Todas as provas</option>';state.tests.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=t.name+(t.className?` • ${t.className}`:"");els.statsTestSelect.appendChild(o)});els.statsTestSelect.value=state.tests.some(t=>t.id===current)?current:""}
function currentStatsHistory(){const id=els.statsTestSelect?.value||"";return id?state.history.filter(h=>h.testId===id):state.history}
function renderStatsDashboard(){if(!els.statsSummary)return;populateStatsSelects();const items=currentStatsHistory();if(!items.length){els.statsSummary.innerHTML='<div class="stats-empty">Sem correções para calcular estatísticas.</div>';els.questionStatsList.innerHTML="";return}const percentages=items.map(x=>Number(x.summary?.percent)||0),grades=items.map(x=>Number(x.summary?.grade)||0),avg=a=>a.reduce((s,v)=>s+v,0)/a.length;els.statsSummary.innerHTML=`<div><span>Correções</span><strong>${items.length}</strong></div><div><span>Média</span><strong>${formatNumber(avg(percentages),1)}%</strong></div><div><span>Maior nota</span><strong>${formatNumber(Math.max(...grades),2)}</strong></div><div><span>Menor nota</span><strong>${formatNumber(Math.min(...grades),2)}</strong></div>`;
  const selectedId=els.statsTestSelect.value;if(!selectedId){els.questionStatsList.innerHTML='<p class="stats-hint">Selecione uma prova específica para ver estatísticas por questão.</p>';return}const test=state.tests.find(t=>t.id===selectedId)||testFromHistory(items[0]),arr=Array.from({length:test.questionCount},(_,i)=>({q:i+1,total:0,notCorrect:0,review:0}));items.forEach(h=>(h.rows||[]).forEach((r,i)=>{if(!arr[i]||h.annulled?.[i])return;arr[i].total++;if(r.status==="review")arr[i].review++;if(r.status!=="marked"||r.detected!==(h.officialAnswers?.[i]||test.answers[i]))arr[i].notCorrect++}));arr.sort((a,b)=>(b.notCorrect/Math.max(1,b.total))-(a.notCorrect/Math.max(1,a.total)));els.questionStatsList.innerHTML=arr.map(x=>{const pct=x.total?Math.round(x.notCorrect/x.total*100):0;return`<div class="question-stat"><strong>Q${String(x.q).padStart(2,"0")}</strong><div class="stat-bar"><i style="width:${pct}%"></i></div><span>${pct}% não corretas${x.review?` • ${x.review} revisão${x.review>1?"ões":""}`:""}</span></div>`}).join("")}
function exportStatsCsv(){const items=currentStatsHistory();if(!items.length)return alert("Não há dados para exportar.");const rows=[["Prova","Turma da prova","Aluno","Série/turma do aluno","Data","Acertos","Erros","Aproveitamento","Nota","Pendências"]];items.forEach(h=>rows.push([h.testName,h.className||"",h.studentId||"",h.studentSeries||"",new Date(h.updatedAt||h.createdAt).toLocaleString("pt-BR"),h.summary?.correct||0,h.summary?.wrong||0,(h.summary?.percent||0)+"%",formatNumber(h.summary?.grade,2),h.summary?.pending||0]));downloadBlob(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(";")).join("\n")],{type:"text/csv;charset=utf-8"}),`gabarita-relatorio-${new Date().toISOString().slice(0,10)}.csv`)}

function updateBatchStatus(){if(els.batchStatus)els.batchStatus.textContent=`Lote atual: ${state.batchCount} correç${state.batchCount===1?"ão":"ões"}`}
function updateHome(){if(!els.homeTestsCount)return;els.homeTestsCount.textContent=state.tests.length;els.homeCorrectionsCount.textContent=state.history.length;els.homePendingCount.textContent=state.history.filter(h=>(h.summary?.pending??((h.summary?.review||0)+(h.summary?.multiple||0)+(h.summary?.blank||0)))>0).length;const h=state.history[0];els.homeLastCorrection.textContent=h?`${h.testName}${h.className?` • ${h.className}`:""} — ${h.studentId||"Aluno não informado"} — ${h.summary?.percent||0}%`:`Nenhuma correção realizada ainda.`}

function startNextCorrection(){state.currentImageCanvas=null;state.currentResults=[];state.currentCorrectionId=null;state.lastDetection=null;state.currentQuality=null;state.lastValidation=null;state.activeResultTest=null;state.currentReadOnly=false;els.studentId.value="";els.photoCanvas.classList.add("hidden");els.imagePlaceholder.classList.remove("hidden");els.resultPanel.classList.add("hidden");els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;showRecognition();updatePhotoQuality();setMessage(els.scanMessage,"Pronto para a próxima prova.","ok");if(els.sequenceMode.checked)openCamera()}
function analyzeCurrentImage(){const test=getSelectedTest();if(!test)return setMessage(els.scanMessage,"Cadastre e selecione um gabarito primeiro.","error");if(!state.currentImageCanvas)return setMessage(els.scanMessage,"Tire uma foto ou escolha uma imagem primeiro.","error");els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;els.analyzeBtn.textContent="Validando e analisando…";setMessage(els.scanMessage,"Confirmando o modelo do Gabarita, corrigindo perspectiva e lendo as marcações…");setTimeout(()=>{try{const sensitivity=Number(els.markSensitivity.value)/100,detection=scanSheet(state.currentImageCanvas,test,sensitivity);state.lastDetection=detection;state.lastValidation=detection.validation;state.currentCorrectionId=null;showRecognition(detection.validation);drawDetectionOverlay(detection);const readOnly=!!els.readOnlyMode.checked;renderResults(test,detection.results,{readOnly});const review=detection.results.filter(x=>(x.status==="review"||x.status==="multiple")&&!test.annulled[x.question-1]).length;setMessage(els.scanMessage,readOnly?`Leitura concluída. ${review?`${review} pendência${review>1?"s":""} para conferir.`:"Todas as marcações foram lidas com boa confiança."}`:review?`Análise concluída. ${review} ${review===1?"questão precisa":"questões precisam"} de conferência manual.`:`Gabarito reconhecido com ${Math.round(detection.validation.overall*100)}% de confiança. Correção concluída.`,review?"warn":"ok");els.resultPanel.scrollIntoView({behavior:"smooth",block:"start"})}catch(err){console.error(err);renderPhotoPreview();els.resultPanel.classList.add("hidden");if(err.validation){state.lastValidation=err.validation;showRecognition(err.validation,true)}else{els.recognitionBox.className="recognition-box bad";els.recognitionStatus.textContent="Gabarito não reconhecido";els.recognitionDetails.innerHTML="<span class=\"quality-chip\">Padrão do Gabarita não confirmado</span>"}setMessage(els.scanMessage,err.message||"Não consegui analisar o gabarito.","error")}finally{els.analyzeBtn.disabled=false;els.reprocessBtn.disabled=!state.currentImageCanvas;els.analyzeBtn.textContent="Analisar gabarito"}},30)}

function updateDataStats(){if(els.dataStats)els.dataStats.textContent=`${state.tests.length} gabarito${state.tests.length===1?"":"s"} • ${state.history.length} correç${state.history.length===1?"ão":"ões"}`;updateHome();renderStatsDashboard()}
function exportBackup(){const data={app:"Gabarita",version:V14.version,exportedAt:new Date().toISOString(),tests:state.tests,history:state.history,settings:state.settings};downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),`gabarita-backup-${new Date().toISOString().slice(0,10)}.json`);setMessage(els.backupMessage,"Backup exportado.","ok")}
function switchView(name){els.views.forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));els.navButtons.forEach(b=>b.classList.toggle("active",b.dataset.view===name));state.settings.currentView=name;saveSettings();if(name==="home")updateHome();if(name==="generator")renderGenerator();if(name==="register")renderTests();if(name==="correct"){renderScanSelect();updateSelectedTestInfo();renderHistory();updateBatchStatus()}if(name==="data"){updateDataStats();renderStatsDashboard()}window.scrollTo({top:0,behavior:"smooth"})}
function restoreSettings(){els.genQuestionCount.value=clampInt(state.settings.generatorQuestions,1,50,10);els.genAlternativeCount.value=clampInt(state.settings.generatorAlternatives,2,5,5);els.markSensitivity.value=clampInt(state.settings.sensitivity,18,55,30);els.sensitivityValue.textContent=`${els.markSensitivity.value}%`;els.sequenceMode.checked=!!state.settings.sequenceMode;els.studentId.value=state.settings.studentId||"";if(els.readOnlyMode)els.readOnlyMode.checked=!!state.settings.readOnlyMode;if(els.historySearch)els.historySearch.value=state.settings.historySearch||"";if(els.historyPeriod)els.historyPeriod.value=state.settings.historyPeriod||"all";if(els.historyOnlyReview)els.historyOnlyReview.checked=!!state.settings.historyOnlyReview;populateHistoryFilters();populateStatsSelects();updateBatchStatus();updateHome()}
/* ======================= FIM GABARITA V1.4 ======================= */
/* ========================= GABARITA V1.5 ========================= */
const V15 = Object.freeze({
  version:"1.6.0",AUTO_VALUE:"__auto",idMax:1023,
  codeCell:2.05,codeGap:.52,codeRows:4,codeCols:4,codeTop:4.0,
  minCodeContrast:34,minCodeConfidence:.45
});

Object.assign(els,{genLinkedTest:$("genLinkedTest"),identityBox:$("identityBox"),identityStatus:$("identityStatus"),identityDetails:$("identityDetails")});

function hashString32(text){let h=2166136261>>>0;for(const ch of String(text||"")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h>>>0}
function sheetCodeFromId(id){return(hashString32(id)%1023)+1}
function sheetCodeLabel(code){return`G-${Number(code||0).toString(16).toUpperCase().padStart(3,"0")}`}
function allocateSheetCode(id,ignoreId=""){const used=new Set((state?.tests||[]).filter(t=>t.id!==ignoreId).map(t=>Number(t.sheetCode)).filter(n=>n>=1&&n<=V15.idMax));let code=sheetCodeFromId(id);for(let i=0;i<V15.idMax;i++){if(!used.has(code))return code;code=code%V15.idMax+1}return 1}
function normalizeTest(t){
  const q=clampInt(t?.questionCount,1,50,10),a=clampInt(t?.alternativeCount,2,5,5),letters=alternativesFor(a),id=t?.id||uid("gabarito"),raw=Number.parseInt(t?.sheetCode,10);
  return{...t,id,name:t?.name||"Gabarito",className:String(t?.className||"").trim(),questionCount:q,alternativeCount:a,answers:Array.from({length:q},(_,i)=>letters.includes(t?.answers?.[i])?t.answers[i]:""),annulled:Array.from({length:q},(_,i)=>!!t?.annulled?.[i]),maxScore:Number(t?.maxScore)>0?Number(t.maxScore):10,annulledAwardPoint:t?.annulledAwardPoint!==false,sheetCode:Number.isFinite(raw)&&raw>=1&&raw<=1023?raw:sheetCodeFromId(id),createdAt:t?.createdAt||new Date().toISOString(),updatedAt:t?.updatedAt||new Date().toISOString()}
}
function loadTests(){return loadArray(STORAGE.tests,STORAGE.oldTests,STORAGE.olderTests,STORAGE.legacyTests).map(normalizeTest)}
function loadSettings(){const d={generatorQuestions:10,generatorAlternatives:5,generatorLinkedTestId:"",sensitivity:30,selectedTestId:"",currentView:"home",sequenceMode:false,studentId:"",readOnlyMode:false,historySearch:"",historyTestFilter:"",historyPeriod:"all",historyOnlyReview:false,statsTestId:""};const older=safeParse(localStorage.getItem(STORAGE.olderSettings),{}),old=safeParse(localStorage.getItem(STORAGE.oldSettings),{});return{...d,...older,...old,...safeParse(localStorage.getItem(STORAGE.settings),{})}}
function ensureUniqueSheetCodes(){const used=new Set();let changed=false;for(const t of state.tests){let c=Number(t.sheetCode);if(!Number.isFinite(c)||c<1||c>V15.idMax||used.has(c)){c=sheetCodeFromId(t.id);while(used.has(c))c=c%V15.idMax+1;t.sheetCode=c;changed=true}used.add(c)}if(changed)localStorage.setItem(STORAGE.tests,JSON.stringify(state.tests))}

function payloadBitsForCode(code){const data=Array.from({length:10},(_,i)=>(code>>(9-i))&1),p1=data.filter((_,i)=>i%2===0).reduce((a,b)=>a^b,0),p2=data.filter((_,i)=>i%2===1).reduce((a,b)=>a^b,0);return[...data,p1,p2]}
function visualCodeBits(code){return[1,0,1,0,...payloadBitsForCode(clampInt(code,1,1023,1))]}
function codeGeometry(layout){const total=V15.codeCols*V15.codeCell+(V15.codeCols-1)*V15.codeGap,left=(layout.widthMm-total)/2;return Array.from({length:16},(_,i)=>({x:left+(i%4)*(V15.codeCell+V15.codeGap),y:V15.codeTop+Math.floor(i/4)*(V15.codeCell+V15.codeGap)}))}
function drawVisualCode(renderer,layout,code){if(!(Number(code)>=1))return;const bits=visualCodeBits(Number(code)),cells=codeGeometry(layout);cells.forEach((cell,i)=>{renderer.strokeRect(cell.x,cell.y,V15.codeCell,V15.codeCell,.22);if(bits[i])renderer.fillRect(cell.x+.28,cell.y+.28,V15.codeCell-.56,V15.codeCell-.56)})}

function drawSheet(renderer,layout,filledAnswers=null,options={}){
  renderer.strokeRect(MODEL.outerInset,MODEL.outerInset,layout.widthMm-MODEL.outerInset*2,layout.heightMm-MODEL.outerInset*2,.45);
  const left=MODEL.markerInset,right=layout.widthMm-MODEL.markerInset-MODEL.markerSize,top=MODEL.markerInset,bottom=layout.heightMm-MODEL.markerInset-MODEL.markerSize;
  renderer.fillRect(left,top,MODEL.markerSize,MODEL.markerSize);renderer.fillRect(right,top,MODEL.markerSize,MODEL.markerSize);renderer.fillRect(left,bottom,MODEL.markerSize,MODEL.markerSize);renderer.fillRect(right,bottom,MODEL.markerSize,MODEL.markerSize);
  /* Sem QR, sem código visual na folha. */
  for(let c=0;c<layout.columns;c++){const originX=layout.columnOrigins[c];layout.alternatives.forEach((letter,i)=>renderer.text(letter,originX+layout.bubbleXs[i],MODEL.headerY,3.5,true,"center"));for(let r=0;r<layout.rowsPerColumn;r++){const qn=questionNumber(layout,c,r);if(qn>layout.questionCount)continue;const y=(layout.firstRowY??MODEL.firstRowY)+r*MODEL.rowPitch;renderer.text(String(qn).padStart(2,"0"),originX+MODEL.numberLocalX,y+1.1,3.2,true,"center");layout.bubbleXs.forEach((x,i)=>{renderer.circle(originX+x,y,MODEL.bubbleRadius,.55);if(filledAnswers&&filledAnswers[qn-1]===layout.alternatives[i])renderer.fillCircle(originX+x,y,1.55)})}}
}

function getGeneratorLinkedTest(){return state.tests.find(t=>t.id===(els.genLinkedTest?.value||state.settings.generatorLinkedTestId))||null}
function renderLinkedTestSelect(){if(!els.genLinkedTest)return;const current=els.genLinkedTest.value||state.settings.generatorLinkedTestId||"";els.genLinkedTest.innerHTML='<option value="">Modelo genérico — sem identificação automática</option>';state.tests.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=`${t.name}${t.className?` • ${t.className}`:""} • ${sheetCodeLabel(t.sheetCode)}`;els.genLinkedTest.appendChild(o)});els.genLinkedTest.value=state.tests.some(t=>t.id===current)?current:"";state.settings.generatorLinkedTestId=els.genLinkedTest.value;saveSettings()}
function renderGenerator(normalizeInput=false){
  const linked=getGeneratorLinkedTest();let q,a;if(linked){q=linked.questionCount;a=linked.alternativeCount;els.genQuestionCount.value=q;els.genAlternativeCount.value=a;els.genQuestionCount.disabled=true;els.genAlternativeCount.disabled=true}else{els.genQuestionCount.disabled=false;els.genAlternativeCount.disabled=false;const raw=Number.parseInt(els.genQuestionCount.value,10);q=Number.isFinite(raw)?clampInt(raw,1,50,10):10;a=clampInt(els.genAlternativeCount.value,2,5,5);if(normalizeInput)els.genQuestionCount.value=q;els.genAlternativeCount.value=a}
  state.settings.generatorQuestions=q;state.settings.generatorAlternatives=a;state.settings.generatorLinkedTestId=linked?.id||"";saveSettings();const layout=layoutFor(q,a),scale=MODEL.previewPxPerMm,dpr=Math.min(devicePixelRatio||1,2),cw=Math.round(layout.widthMm*scale),ch=Math.round(layout.heightMm*scale);els.generatorCanvas.width=cw*dpr;els.generatorCanvas.height=ch*dpr;els.generatorCanvas.style.width=`${cw}px`;els.generatorCanvas.style.height=`${ch}px`;const ctx=els.generatorCanvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle="#fff";ctx.fillRect(0,0,cw,ch);drawSheet(canvasRenderer(ctx,scale),layout,null,{sheetCode:linked?.sheetCode});const last=layout.alternatives.at(-1);els.genBadge.textContent=`${q} ${q===1?"questão":"questões"} • A–${last}${linked?` • ${sheetCodeLabel(linked.sheetCode)}`:""}`;els.genLayoutInfo.innerHTML=linked?`<strong>Identificação automática ativa</strong><br>Prova: ${escapeHtml(linked.name)}${linked.className?` • ${escapeHtml(linked.className)}`:""}<br>Código: <b>${sheetCodeLabel(linked.sheetCode)}</b><br>${layout.columns===1?"1 coluna":"2 colunas"} • ${layout.widthMm} × ${layout.heightMm} mm`:`<strong>Modelo genérico</strong><br>Sem identificação automática. Na correção, selecione manualmente o gabarito.<br>${layout.columns===1?"1 coluna":"2 colunas"} • Alternativas: ${layout.alternatives.join(" • ")} • ${layout.widthMm} × ${layout.heightMm} mm`
}
function cleanFileName(s){return String(s||"gabarita").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").toLowerCase()||"gabarita"}
function downloadPng(){renderGenerator();els.generatorCanvas.toBlob(blob=>{if(!blob)return setMessage(els.genStatus,"Não foi possível gerar a imagem.","error");const a=document.createElement("a"),linked=getGeneratorLinkedTest(),q=els.genQuestionCount.value,last=alternativesFor(els.genAlternativeCount.value).at(-1).toLowerCase();a.href=URL.createObjectURL(blob);a.download=linked?`gabarita-${cleanFileName(linked.name)}-${sheetCodeLabel(linked.sheetCode).toLowerCase()}.png`:`gabarito-${q}-questoes-a-${last}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);setMessage(els.genStatus,linked?`PNG vinculado a “${linked.name}” gerado.`:"PNG genérico gerado.","ok")},"image/png")}
function createPdfBytes(layout,sheetCode=null){const MM_TO_PT=72/25.4,pageW=layout.widthMm*MM_TO_PT,pageH=layout.heightMm*MM_TO_PT,pt=mm=>mm*MM_TO_PT,py=mm=>pageH-pt(mm),commands=[];const renderer={strokeRect(x,y,w,h,l){commands.push(`${pdfNumber(pt(l))} w 0 G ${pdfNumber(pt(x))} ${pdfNumber(pageH-pt(y+h))} ${pdfNumber(pt(w))} ${pdfNumber(pt(h))} re S`)},fillRect(x,y,w,h){commands.push(`0 g ${pdfNumber(pt(x))} ${pdfNumber(pageH-pt(y+h))} ${pdfNumber(pt(w))} ${pdfNumber(pt(h))} re f`)},circle(x,y,r,l){const cx=pt(x),cy=py(y),rr=pt(r),k=.5522847498,kr=rr*k;commands.push(`${pdfNumber(pt(l))} w 0 G ${pdfNumber(cx+rr)} ${pdfNumber(cy)} m ${pdfNumber(cx+rr)} ${pdfNumber(cy+kr)} ${pdfNumber(cx+kr)} ${pdfNumber(cy+rr)} ${pdfNumber(cx)} ${pdfNumber(cy+rr)} c ${pdfNumber(cx-kr)} ${pdfNumber(cy+rr)} ${pdfNumber(cx-rr)} ${pdfNumber(cy+kr)} ${pdfNumber(cx-rr)} ${pdfNumber(cy)} c ${pdfNumber(cx-rr)} ${pdfNumber(cy-kr)} ${pdfNumber(cx-kr)} ${pdfNumber(cy-rr)} ${pdfNumber(cx)} ${pdfNumber(cy-rr)} c ${pdfNumber(cx+kr)} ${pdfNumber(cy-rr)} ${pdfNumber(cx+rr)} ${pdfNumber(cy-kr)} ${pdfNumber(cx+rr)} ${pdfNumber(cy)} c S`)},fillCircle(x,y,r){const cx=pt(x),cy=py(y),rr=pt(r),k=.5522847498,kr=rr*k;commands.push(`0 g ${pdfNumber(cx+rr)} ${pdfNumber(cy)} m ${pdfNumber(cx+rr)} ${pdfNumber(cy+kr)} ${pdfNumber(cx+kr)} ${pdfNumber(cy+rr)} ${pdfNumber(cx)} ${pdfNumber(cy+rr)} c ${pdfNumber(cx-kr)} ${pdfNumber(cy+rr)} ${pdfNumber(cx-rr)} ${pdfNumber(cy+kr)} ${pdfNumber(cx-rr)} ${pdfNumber(cy)} c ${pdfNumber(cx-rr)} ${pdfNumber(cy-kr)} ${pdfNumber(cx-kr)} ${pdfNumber(cy-rr)} ${pdfNumber(cx)} ${pdfNumber(cy-rr)} c ${pdfNumber(cx+kr)} ${pdfNumber(cy-rr)} ${pdfNumber(cx+rr)} ${pdfNumber(cy-kr)} ${pdfNumber(cx+rr)} ${pdfNumber(cy)} c f`)},text(value,x,y,size,bold=false,align="left"){const fs=pt(size),aw=fs*.56*String(value).length;let tx=pt(x);if(align==="center")tx-=aw/2;if(align==="right")tx-=aw;commands.push(`BT /${bold?"F2":"F1"} ${pdfNumber(fs)} Tf 0 g ${pdfNumber(tx)} ${pdfNumber(py(y))} Td (${pdfEscapeText(value)}) Tj ET`)}};drawSheet(renderer,layout,null,{sheetCode});const stream=commands.join("\n"),objects=[];objects[1]=`<< /Type /Catalog /Pages 2 0 R >>`;objects[2]=`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`;objects[3]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNumber(pageW)} ${pdfNumber(pageH)}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`;objects[4]=`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`;objects[5]=`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;objects[6]=`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;let pdf="%PDF-1.4\n%Gabarita\n";const offsets=[0];for(let i=1;i<=6;i++){offsets[i]=new TextEncoder().encode(pdf).length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`}const xrefOffset=new TextEncoder().encode(pdf).length;pdf+=`xref\n0 7\n0000000000 65535 f \n`;for(let i=1;i<=6;i++)pdf+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;pdf+=`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;return new TextEncoder().encode(pdf)}
function generatePdf(){try{const linked=getGeneratorLinkedTest(),q=linked?.questionCount??clampInt(els.genQuestionCount.value,1,50,10),a=linked?.alternativeCount??clampInt(els.genAlternativeCount.value,2,5,5),layout=layoutFor(q,a),bytes=createPdfBytes(layout,linked?.sheetCode),blob=new Blob([bytes],{type:"application/pdf"}),link=document.createElement("a"),last=layout.alternatives.at(-1).toLowerCase();link.href=URL.createObjectURL(blob);link.download=linked?`gabarita-${cleanFileName(linked.name)}-${sheetCodeLabel(linked.sheetCode).toLowerCase()}.pdf`:`gabarito-${q}-questoes-a-${last}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);setMessage(els.genStatus,linked?`PDF vinculado a “${linked.name}” gerado com identificação automática.`:"PDF genérico gerado.","ok")}catch(error){console.error(error);setMessage(els.genStatus,"Não consegui gerar o PDF.","error")}}

function renderTests(){els.testsList.innerHTML="";els.testsEmpty.classList.toggle("hidden",state.tests.length>0);state.tests.forEach(test=>{const card=document.createElement("article");card.className="test-card";const last=alternativesFor(test.alternativeCount).at(-1),annulled=test.annulled.filter(Boolean).length;card.innerHTML=`<h3></h3><div class="test-meta">${test.className?`<span class="badge">${escapeHtml(test.className)}</span>`:""}<span class="badge">${test.questionCount} questões</span><span class="badge">A–${last}</span><span class="badge">Nota ${formatNumber(test.maxScore,1)}</span>${annulled?`<span class="badge">${annulled} anulada${annulled>1?"s":""}</span>`:""}</div><div class="card-actions"><button class="btn primary" data-action="correct" data-id="${test.id}">Corrigir</button><button class="btn secondary" data-action="generate" data-id="${test.id}">Gerar folha</button><button class="btn secondary" data-action="edit" data-id="${test.id}">Editar</button><button class="btn secondary" data-action="duplicate" data-id="${test.id}">Duplicar</button><button class="btn danger" data-action="delete" data-id="${test.id}">Excluir</button></div>`;card.querySelector("h3").textContent=test.name;els.testsList.appendChild(card)});renderLinkedTestSelect();renderScanSelect();updateDataStats();populateStatsSelects();updateHome()}
function saveCurrentTest(){const name=els.testName.value.trim(),className=els.testClassName?.value.trim()||"",q=clampInt(els.testQuestionCount.value,1,50,10),a=clampInt(els.testAlternativeCount.value,2,5,5),maxScore=Number(String(els.testMaxScore.value).replace(",","."));if(!name)return setMessage(els.editorMessage,"Digite o nome da prova.","error");if(!(maxScore>0))return setMessage(els.editorMessage,"Informe uma nota máxima válida.","error");if(state.draftAnswers.length!==q||state.draftAnswers.some((x,i)=>!state.draftAnnulled[i]&&!x))return setMessage(els.editorMessage,"Marque a resposta correta de todas as questões não anuladas.","error");const existing=state.tests.find(x=>x.id===state.editingId),id=state.editingId||uid("gabarito"),sheetCode=existing?.sheetCode||allocateSheetCode(id);const obj=normalizeTest({id,name,className,questionCount:q,alternativeCount:a,answers:[...state.draftAnswers],annulled:[...state.draftAnnulled],maxScore,annulledAwardPoint:els.annulledAwardPoint.checked,sheetCode,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});const idx=state.tests.findIndex(x=>x.id===obj.id);idx>=0?state.tests[idx]=obj:state.tests.push(obj);ensureUniqueSheetCodes();saveTests();renderTests();closeEditor();switchView("register")}
function duplicateTest(id){const t=state.tests.find(x=>x.id===id);if(!t)return;const newId=uid("gabarito"),copy=normalizeTest({...t,id:newId,sheetCode:allocateSheetCode(newId),name:`${t.name} - Cópia`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});state.tests.push(copy);ensureUniqueSheetCodes();saveTests();renderTests();setTimeout(()=>openEditor(copy),0)}

function isAutoMode(){return els.scanTestSelect?.value===V15.AUTO_VALUE}
function renderScanSelect(){const previous=els.scanTestSelect?.value||state.settings.selectedTestId||"";els.scanTestSelect.innerHTML="";if(!state.tests.length){const o=document.createElement("option");o.value="";o.textContent="Cadastre um gabarito primeiro";els.scanTestSelect.appendChild(o)}else{if(state.tests.length>1){const auto=document.createElement("option");auto.value=V15.AUTO_VALUE;auto.textContent="✨ Identificar automaticamente pela foto";els.scanTestSelect.appendChild(auto)}state.tests.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=`${t.name}${t.className?` • ${t.className}`:""}`;els.scanTestSelect.appendChild(o)});const valid=(previous===V15.AUTO_VALUE&&state.tests.length>1)||state.tests.some(t=>t.id===previous);els.scanTestSelect.value=valid?previous:(state.tests.length>1?V15.AUTO_VALUE:state.tests[0].id)}state.settings.selectedTestId=els.scanTestSelect.value;saveSettings();updateSelectedTestInfo()}
function getSelectedTest(){return state.tests.find(x=>x.id===els.scanTestSelect?.value)||null}
function canAnalyzeCurrent(){return!!state.currentImageCanvas&&state.tests.length>0&&(isAutoMode()||!!getSelectedTest())}
function showIdentityStatus(kind="neutral",text="Aguardando imagem.",details=""){if(!els.identityBox)return;els.identityBox.className=`recognition-box ${kind}`;els.identityStatus.textContent=text;els.identityDetails.innerHTML=details}
function updateSelectedTestInfo(){const t=getSelectedTest();state.settings.selectedTestId=els.scanTestSelect?.value||"";saveSettings();if(!state.tests.length){els.selectedTestInfo.textContent="Nenhum gabarito cadastrado.";showIdentityStatus("neutral","Cadastre um gabarito primeiro.");els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;return}if(isAutoMode()){els.selectedTestInfo.innerHTML=`<strong>Identificação automática</strong><br>${state.tests.length} gabaritos disponíveis. O Gabarita procurará o código visual da prova e selecionará o cadastro correto.`;showIdentityStatus("neutral","Aguardando foto para identificar a prova.",`<span class="quality-chip">${state.tests.length} gabaritos cadastrados</span>`)}else if(t){const last=alternativesFor(t.alternativeCount).at(-1),ann=t.annulled.filter(Boolean).length;els.selectedTestInfo.innerHTML=`<strong>${escapeHtml(t.name)}</strong>${t.className?`<br>Turma: ${escapeHtml(t.className)}`:""}<br>${t.questionCount} questões • A–${last} • Nota ${formatNumber(t.maxScore,1)}${ann?` • ${ann} anulada${ann>1?"s":""}`:""}`;showIdentityStatus("good",`Seleção manual: ${t.name}`,`<span class="quality-chip">${sheetCodeLabel(t.sheetCode)}</span>`)}els.analyzeBtn.disabled=!canAnalyzeCurrent();els.reprocessBtn.disabled=!canAnalyzeCurrent();if(state.currentImageCanvas)updatePhotoQuality()}
function setCurrentImageCanvas(canvas){state.currentImageCanvas=canvas;state.lastDetection=null;state.currentResults=[];state.currentCorrectionId=null;els.imagePlaceholder.classList.add("hidden");els.photoCanvas.classList.remove("hidden");renderPhotoPreview();els.resultPanel.classList.add("hidden");els.analyzeBtn.disabled=!canAnalyzeCurrent();els.reprocessBtn.disabled=!canAnalyzeCurrent();if(isAutoMode())showIdentityStatus("neutral","Imagem pronta. A prova será identificada ao analisar.");updatePhotoQuality()}

function decodeVisualCodeFrom(gray,w,h,H,layout){const vals=codeGeometry(layout).map(c=>sampleCanonicalMean(gray,w,h,H,c.x+V15.codeCell/2,c.y+V15.codeCell/2,.47)),black=(vals[0]+vals[2])/2,white=(vals[1]+vals[3])/2,contrast=white-black;if(!(contrast>=V15.minCodeContrast))return{valid:false,confidence:clamp(contrast/V15.minCodeContrast,0,1)*.3,contrast,values:vals,reason:"contraste do código insuficiente"};const threshold=(black+white)/2,bits=vals.map(v=>v<threshold?1:0),signatureOk=bits.slice(0,4).join("")==="1010",payload=bits.slice(4),data=payload.slice(0,10),p1=payload[10],p2=payload[11],cp1=data.filter((_,i)=>i%2===0).reduce((a,b)=>a^b,0),cp2=data.filter((_,i)=>i%2===1).reduce((a,b)=>a^b,0),parityOk=p1===cp1&&p2===cp2;let code=0;data.forEach(bit=>{code=(code<<1)|bit});const margins=vals.map(v=>Math.abs(v-threshold)),marginScore=clamp((margins.reduce((a,b)=>a+b,0)/margins.length)/75,0,1),confidence=clamp((contrast-20)/95*.65+marginScore*.35,0,1),valid=signatureOk&&parityOk&&code>=1&&code<=V15.idMax&&confidence>=V15.minCodeConfidence;return{valid,code,confidence,contrast,bits,signatureOk,parityOk,values:vals,reason:!signatureOk?"assinatura visual inválida":!parityOk?"verificação do código falhou":code<1?"código vazio":confidence<V15.minCodeConfidence?"código com baixa confiança":""}}
function decodeVisualCode(analysis,H,layout){const a=decodeVisualCodeFrom(analysis.normalized,analysis.width,analysis.height,H,layout),b=decodeVisualCodeFrom(analysis.enhanced,analysis.width,analysis.height,H,layout);if(a.valid&&!b.valid)return{...a,source:"normal"};if(b.valid&&!a.valid)return{...b,source:"enhanced"};return a.confidence>=b.confidence?{...a,source:"normal"}:{...b,source:"enhanced"}}
function scanSheet(source,test,sensitivity,options={}){const layout=layoutFor(test.questionCount,test.alternativeCount),analysis=getAnalysisImage(source);analysis.enhanced=adaptiveNormalize(analysis.gray,analysis.width,analysis.height);let candidates=findDarkComponents(analysis.normalized,analysis.width,analysis.height),quad=chooseMarkerQuad(candidates,layout,analysis.width,analysis.height),used="normal";if(!quad){candidates=findDarkComponents(analysis.enhanced,analysis.width,analysis.height);quad=chooseMarkerQuad(candidates,layout,analysis.width,analysis.height);used="enhanced"}if(!quad)throw new Error("Gabarito não reconhecido: não encontrei as quatro marcas pretas do modelo.");const m=MODEL.markerInset+MODEL.markerSize/2,canon=[{x:m,y:m},{x:layout.widthMm-m,y:m},{x:layout.widthMm-m,y:layout.heightMm-m},{x:m,y:layout.heightMm-m}],H=homography(canon,quad.points),validation=validateSheetStructure(analysis,H,layout,quad);if(!validation.valid){const e=new Error(`Imagem inválida — o padrão do Gabarita não foi confirmado${validation.reasons.length?`: ${validation.reasons.join(", ")}`:""}.`);e.validation=validation;throw e}const visualIdentity=decodeVisualCode(analysis,H,layout);if(visualIdentity.valid&&!options.ignoreCodeMismatch&&Number(test.sheetCode)!==Number(visualIdentity.code)){const found=state.tests.find(t=>Number(t.sheetCode)===Number(visualIdentity.code));const e=new Error(found?`Esta folha foi identificada como “${found.name}”, mas você selecionou “${test.name}”. Use a identificação automática ou escolha o gabarito correto.`:`O código ${sheetCodeLabel(visualIdentity.code)} não corresponde ao gabarito selecionado.`);e.identity=visualIdentity;throw e}const results=[];for(let c=0;c<layout.columns;c++)for(let r=0;r<layout.rowsPerColumn;r++){const qn=questionNumber(layout,c,r);if(qn>layout.questionCount)continue;const y=(layout.firstRowY??MODEL.firstRowY)+r*MODEL.rowPitch,origin=layout.columnOrigins[c];const samples=layout.bubbleXs.map(x=>{const a=sampleBubble(analysis.normalized,analysis.width,analysis.height,H,origin+x,y),b=sampleBubble(analysis.enhanced,analysis.width,analysis.height,H,origin+x,y),raw=sampleBubble(analysis.gray,analysis.width,analysis.height,H,origin+x,y);return chooseBubbleEvidence(raw,a,b)});results.push({question:qn,...classifyQuestion(samples,layout.alternatives,sensitivity),manual:false})}return{layout,analysis,quad,H,results,used,validation,visualIdentity}}
function autoIdentifyAndScan(source,sensitivity){if(!state.tests.length)throw new Error("Cadastre pelo menos um gabarito antes de usar a identificação automática.");const groups=new Map();state.tests.forEach(t=>{const k=`${t.questionCount}-${t.alternativeCount}`;if(!groups.has(k))groups.set(k,t)});let bestFailure=null;for(const representative of groups.values()){try{const detection=scanSheet(source,representative,sensitivity,{ignoreCodeMismatch:true}),id=detection.visualIdentity;if(!id?.valid){if(!bestFailure||detection.validation.overall>(bestFailure.validation?.overall||0))bestFailure=detection;continue}const match=state.tests.find(t=>Number(t.sheetCode)===Number(id.code));if(match&&match.questionCount===representative.questionCount&&match.alternativeCount===representative.alternativeCount)return{test:match,detection,identity:id};if(match){const exact=scanSheet(source,match,sensitivity,{ignoreCodeMismatch:true});if(exact.visualIdentity?.valid&&Number(exact.visualIdentity.code)===Number(match.sheetCode))return{test:match,detection:exact,identity:exact.visualIdentity}}}catch(e){if(e.validation&&(!bestFailure||e.validation.overall>(bestFailure.validation?.overall||0)))bestFailure={validation:e.validation}}}const e=new Error("Não consegui identificar automaticamente esta prova. Use um PDF vinculado gerado pela V1.5 ou selecione o gabarito manualmente.");if(bestFailure?.validation)e.validation=bestFailure.validation;throw e}
function createSelfTest(){let test=getSelectedTest();const auto=isAutoMode();if(!test&&auto)test=state.tests[0];if(!test)return setMessage(els.scanMessage,"Cadastre um gabarito primeiro.","error");const layout=layoutFor(test.questionCount,test.alternativeCount),scale=5,c=document.createElement("canvas");c.width=Math.round(layout.widthMm*scale);c.height=Math.round(layout.heightMm*scale);const ctx=c.getContext("2d",{willReadFrequently:true});ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);const fill=test.answers.map((a,i)=>test.annulled[i]?(a||alternativesFor(test.alternativeCount)[0]):a);drawSheet(canvasRenderer(ctx,scale),layout,fill,{sheetCode:test.sheetCode});setCurrentImageCanvas(c);setMessage(els.scanMessage,auto?`Autoteste criado com “${test.name}”. Toque em Analisar para testar a identificação automática.`:"Imagem de autoteste criada com as respostas oficiais e o código da prova. Toque em Analisar gabarito.","ok")}
function analyzeCurrentImage(){if(!state.tests.length)return setMessage(els.scanMessage,"Cadastre um gabarito primeiro.","error");if(!state.currentImageCanvas)return setMessage(els.scanMessage,"Tire uma foto ou escolha uma imagem primeiro.","error");const auto=isAutoMode(),manualTest=getSelectedTest();if(!auto&&!manualTest)return setMessage(els.scanMessage,"Selecione um gabarito ou use a identificação automática.","error");els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;els.analyzeBtn.textContent=auto?"Identificando prova…":"Validando e analisando…";setMessage(els.scanMessage,auto?"Procurando o código da prova, validando o modelo e lendo as marcações…":"Confirmando o modelo do Gabarita, corrigindo perspectiva e lendo as marcações…");setTimeout(()=>{try{const sensitivity=Number(els.markSensitivity.value)/100;let test,detection;if(auto){const identified=autoIdentifyAndScan(state.currentImageCanvas,sensitivity);test=identified.test;detection=identified.detection;els.scanTestSelect.value=test.id;state.settings.selectedTestId=test.id;saveSettings();updateSelectedTestInfo();showIdentityStatus("good",`Prova identificada automaticamente: ${test.name}`,`<span class="quality-chip">${sheetCodeLabel(test.sheetCode)}</span><span class="quality-chip">Código ${Math.round((identified.identity?.confidence||0)*100)}%</span>`)}else{test=manualTest;detection=scanSheet(state.currentImageCanvas,test,sensitivity);if(detection.visualIdentity?.valid)showIdentityStatus("good",`Código confirmado: ${test.name}`,`<span class="quality-chip">${sheetCodeLabel(test.sheetCode)}</span><span class="quality-chip">Confiança ${Math.round(detection.visualIdentity.confidence*100)}%</span>`)}state.lastDetection=detection;state.lastValidation=detection.validation;state.currentCorrectionId=null;showRecognition(detection.validation);drawDetectionOverlay(detection);const readOnly=!!els.readOnlyMode.checked;renderResults(test,detection.results,{readOnly});const review=detection.results.filter(x=>(x.status==="review"||x.status==="multiple")&&!test.annulled[x.question-1]).length;setMessage(els.scanMessage,readOnly?`Leitura concluída para “${test.name}”. ${review?`${review} pendência${review>1?"s":""} para conferir.`:"Todas as marcações foram lidas com boa confiança."}`:review?`“${test.name}” identificada. ${review} ${review===1?"questão precisa":"questões precisam"} de conferência manual.`:`“${test.name}” • gabarito reconhecido com ${Math.round(detection.validation.overall*100)}% de confiança. Correção concluída.`,review?"warn":"ok");els.resultPanel.scrollIntoView({behavior:"smooth",block:"start"})}catch(err){console.error(err);renderPhotoPreview();els.resultPanel.classList.add("hidden");if(auto)showIdentityStatus("bad","Não foi possível identificar a prova.",'<span class="quality-chip">Selecione manualmente se o modelo não foi gerado pela V1.5</span>');if(err.validation){state.lastValidation=err.validation;showRecognition(err.validation,true)}else{els.recognitionBox.className="recognition-box bad";els.recognitionStatus.textContent="Gabarito não reconhecido";els.recognitionDetails.innerHTML='<span class="quality-chip">Padrão do Gabarita não confirmado</span>'}setMessage(els.scanMessage,err.message||"Não consegui analisar o gabarito.","error")}finally{els.analyzeBtn.disabled=!canAnalyzeCurrent();els.reprocessBtn.disabled=!canAnalyzeCurrent();els.analyzeBtn.textContent="Analisar gabarito"}},30)}
function startNextCorrection(){state.currentImageCanvas=null;state.currentResults=[];state.currentCorrectionId=null;state.lastDetection=null;state.currentQuality=null;state.lastValidation=null;state.activeResultTest=null;state.currentReadOnly=false;els.studentId.value="";els.photoCanvas.classList.add("hidden");els.imagePlaceholder.classList.remove("hidden");els.resultPanel.classList.add("hidden");els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;showRecognition();updatePhotoQuality();if(state.tests.length>1){els.scanTestSelect.value=V15.AUTO_VALUE;updateSelectedTestInfo()}setMessage(els.scanMessage,"Pronto para a próxima prova. A identificação automática está pronta.","ok");if(els.sequenceMode.checked)openCamera()}
function exportBackup(){const data={app:"Gabarita",version:V15.version,exportedAt:new Date().toISOString(),tests:state.tests,history:state.history,settings:state.settings};downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),`gabarita-backup-${new Date().toISOString().slice(0,10)}.json`);setMessage(els.backupMessage,"Backup exportado.","ok")}
function switchView(name){els.views.forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));els.navButtons.forEach(b=>b.classList.toggle("active",b.dataset.view===name));state.settings.currentView=name;if(name==="correct"&&state.tests.length>1){state.settings.selectedTestId=V15.AUTO_VALUE;if(els.scanTestSelect)els.scanTestSelect.value=V15.AUTO_VALUE}saveSettings();if(name==="home")updateHome();if(name==="generator"){renderLinkedTestSelect();renderGenerator()}if(name==="register")renderTests();if(name==="correct"){renderScanSelect();updateSelectedTestInfo();renderHistory();updateBatchStatus()}if(name==="data"){updateDataStats();renderStatsDashboard()}window.scrollTo({top:0,behavior:"smooth"})}
function restoreSettings(){renderLinkedTestSelect();if(els.genLinkedTest)els.genLinkedTest.value=state.tests.some(t=>t.id===state.settings.generatorLinkedTestId)?state.settings.generatorLinkedTestId:"";els.genQuestionCount.value=clampInt(state.settings.generatorQuestions,1,50,10);els.genAlternativeCount.value=clampInt(state.settings.generatorAlternatives,2,5,5);els.markSensitivity.value=clampInt(state.settings.sensitivity,18,55,30);els.sensitivityValue.textContent=`${els.markSensitivity.value}%`;els.sequenceMode.checked=!!state.settings.sequenceMode;els.studentId.value=state.settings.studentId||"";if(els.readOnlyMode)els.readOnlyMode.checked=!!state.settings.readOnlyMode;if(els.historySearch)els.historySearch.value=state.settings.historySearch||"";if(els.historyPeriod)els.historyPeriod.value=state.settings.historyPeriod||"all";if(els.historyOnlyReview)els.historyOnlyReview.checked=!!state.settings.historyOnlyReview;populateHistoryFilters();populateStatsSelects();updateBatchStatus();updateHome()}
/* ======================= FIM GABARITA V1.5 ======================= */




/* ============= GABARITA V1.7: SCANNER AUTOMÁTICO E NOME NA FOLHA ============= */
const V16 = {version:"1.8.2",liveInterval:210,stableFrames:2,maxVideoSide:880,ocrTried:false,ocrPromise:null,ocrSerial:0};
Object.assign(els,{
  studentSeries:$("studentSeries"),resultStudentName:$("resultStudentName"),resultStudentSeries:$("resultStudentSeries"),
  resultDetails:$("resultDetails"),showAllDetailsBtn:$("showAllDetailsBtn"),ocrState:$("ocrState"),liveScannerBadge:$("liveScannerBadge")
});
MODEL.headerY=53;MODEL.firstRowY=63;
function layoutFor(questionCount,alternativeCount){
  const q=clampInt(questionCount,1,50,10),a=clampInt(alternativeCount,2,5,5),cols=q<=25?1:2,rows=Math.ceil(q/cols);
  return {questionCount:q,alternativeCount:a,alternatives:alternativesFor(a),bubbleXs:bubbleXs(a),columns:cols,rowsPerColumn:rows,
    widthMm:cols===1?MODEL.oneColumnWidth:MODEL.twoColumnWidth,
    heightMm:Math.ceil(MODEL.firstRowY+(rows-1)*MODEL.rowPitch+MODEL.bubbleRadius+MODEL.bottomPadding),
    columnOrigins:cols===1?[MODEL.oneColumnOriginX]:[...MODEL.twoColumnOrigins],firstRowY:MODEL.firstRowY,identityRegion:true};
}
function drawSheet(renderer,layout,filledAnswers=null,options={}){
  const w=layout.widthMm,h=layout.heightMm,ms=MODEL.markerSize,mi=MODEL.markerInset;
  renderer.strokeRect(MODEL.outerInset,MODEL.outerInset,w-MODEL.outerInset*2,h-MODEL.outerInset*2,.45);
  for(const x of [mi,w-mi-ms])for(const y of [mi,h-mi-ms])renderer.fillRect(x,y,ms,ms);
  renderer.text("NOME (LETRA DE FORMA):",13,15.4,3.3,true);
  renderer.strokeRect(13,29,w-26,.12,.28); // linha para escrita, com margens
  renderer.text("SERIE/TURMA:",13,34.4,3.3,true);
  renderer.strokeRect(13,46,48,.12,.28);
  for(let c=0;c<layout.columns;c++){
    const origin=layout.columnOrigins[c];
    layout.alternatives.forEach((a,i)=>renderer.text(a,origin+layout.bubbleXs[i],MODEL.headerY,3.5,true,"center"));
    for(let r=0;r<layout.rowsPerColumn;r++){
      const qn=questionNumber(layout,c,r);if(qn>layout.questionCount)continue;
      const y=MODEL.firstRowY+r*MODEL.rowPitch;
      renderer.text(String(qn).padStart(2,"0"),origin+MODEL.numberLocalX,y+1.1,3.2,true,"center");
      layout.bubbleXs.forEach((x,i)=>{
        renderer.circle(origin+x,y,MODEL.bubbleRadius,.55);
        if(filledAnswers&&filledAnswers[qn-1]===layout.alternatives[i])renderer.fillCircle(origin+x,y,1.55);
      });
    }
  }
}
function renderLinkedTestSelect(){
  if(!els.genLinkedTest)return;
  const current=els.genLinkedTest.value||state.settings.generatorLinkedTestId||"";
  els.genLinkedTest.innerHTML='<option value="">Modelo genérico (quantidade livre)</option>';
  state.tests.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=`${t.name} • ${t.questionCount} questões • A–${alternativesFor(t.alternativeCount).at(-1)}`;els.genLinkedTest.appendChild(o)});
  els.genLinkedTest.value=state.tests.some(t=>t.id===current)?current:"";
  state.settings.generatorLinkedTestId=els.genLinkedTest.value;saveSettings();
}
function renderGenerator(normalizeInput=false){
  const linked=getGeneratorLinkedTest();let q,a;
  if(linked){q=linked.questionCount;a=linked.alternativeCount;els.genQuestionCount.value=q;els.genAlternativeCount.value=a;els.genQuestionCount.disabled=true;els.genAlternativeCount.disabled=true}
  else{els.genQuestionCount.disabled=false;els.genAlternativeCount.disabled=false;const n=parseInt(els.genQuestionCount.value,10);q=Number.isFinite(n)?clampInt(n,1,50,10):10;a=clampInt(els.genAlternativeCount.value,2,5,5);if(normalizeInput)els.genQuestionCount.value=q}
  state.settings.generatorQuestions=q;state.settings.generatorAlternatives=a;state.settings.generatorLinkedTestId=linked?.id||"";saveSettings();
  const l=layoutFor(q,a),sc=MODEL.previewPxPerMm,dpr=Math.min(devicePixelRatio||1,2),cw=Math.round(l.widthMm*sc),ch=Math.round(l.heightMm*sc),cv=els.generatorCanvas;
  cv.width=cw*dpr;cv.height=ch*dpr;cv.style.width=`${cw}px`;cv.style.height=`${ch}px`;const ctx=cv.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle="white";ctx.fillRect(0,0,cw,ch);drawSheet(canvasRenderer(ctx,sc),l);
  els.genBadge.textContent=`${q} questões • A–${l.alternatives.at(-1)} • Nome e turma`;
  els.genLayoutInfo.innerHTML=`<strong>${linked?escapeHtml(linked.name):"Modelo genérico"}</strong><br>${l.columns} coluna(s) • ${l.widthMm} × ${l.heightMm} mm<br>Nome em letra de forma; sem código visual.`;
}
function downloadPng(){
 renderGenerator();els.generatorCanvas.toBlob(blob=>{if(!blob)return setMessage(els.genStatus,"Não consegui gerar PNG.","error");const linked=getGeneratorLinkedTest(),file=linked?cleanFileName(linked.name):`gabarito-${els.genQuestionCount.value}q`;downloadBlob(blob,`${file}-nome-turma.png`);setMessage(els.genStatus,"PNG gerado, sem QR Code.","ok")},"image/png")
}
function generatePdf(){
  try{const linked=getGeneratorLinkedTest(),l=layoutFor(linked?.questionCount??els.genQuestionCount.value,linked?.alternativeCount??els.genAlternativeCount.value),bytes=createPdfBytes(l),file=linked?cleanFileName(linked.name):`gabarito-${l.questionCount}q`,blob=new Blob([bytes],{type:"application/pdf"});downloadBlob(blob,`${file}-nome-turma.pdf`);setMessage(els.genStatus,"PDF pronto com campo de nome e série/turma, sem QR Code.","ok")}
  catch(e){console.error(e);setMessage(els.genStatus,"Não consegui criar este PDF.","error")}
}
function renderScanSelect(){
  const preferred=els.scanTestSelect?.value||state.settings.selectedTestId||"";
  els.scanTestSelect.innerHTML="";
  if(!state.tests.length){const opt=document.createElement("option");opt.value="";opt.textContent="Cadastre uma prova primeiro";els.scanTestSelect.append(opt)}
  else{if(state.tests.length>1){const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent="Selecione a prova deste lote…";els.scanTestSelect.append(placeholder)}state.tests.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=t.name+(t.className?` • ${t.className}`:"");els.scanTestSelect.append(o)});els.scanTestSelect.value=state.tests.some(t=>t.id===preferred)?preferred:(state.tests.length===1?state.tests[0].id:"")}
  state.settings.selectedTestId=els.scanTestSelect.value;saveSettings();updateSelectedTestInfo();
}
function isAutoMode(){return false}
function canAnalyzeCurrent(){return!!state.currentImageCanvas&&!!getSelectedTest()}
function updateSelectedTestInfo(){
  const t=getSelectedTest();state.settings.selectedTestId=t?.id||"";saveSettings();
  if(!t){els.selectedTestInfo.textContent=state.tests.length>1?"Escolha a prova uma vez para corrigir este lote. Sem QR Code, não é seguro adivinhar qual gabarito oficial usar.":"Cadastre uma prova para começar.";els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;return}
  els.selectedTestInfo.innerHTML=`<strong>${escapeHtml(t.name)}</strong><br>${t.questionCount} questões • A–${alternativesFor(t.alternativeCount).at(-1)} • Nota ${formatNumber(t.maxScore,1)}`;
  els.analyzeBtn.disabled=!state.currentImageCanvas;els.reprocessBtn.disabled=!state.currentImageCanvas;
}
function scanSheet(source,test,sensitivity){
  const layout=layoutFor(test.questionCount,test.alternativeCount),analysis=getAnalysisImage(source);analysis.enhanced=adaptiveNormalize(analysis.gray,analysis.width,analysis.height);
  let comps=findDarkComponents(analysis.normalized,analysis.width,analysis.height),quad=chooseMarkerQuad(comps,layout,analysis.width,analysis.height),used="normal";
  if(!quad){comps=findDarkComponents(analysis.enhanced,analysis.width,analysis.height);quad=chooseMarkerQuad(comps,layout,analysis.width,analysis.height);used="enhanced"}
  if(!quad)throw Error("Não encontrei as quatro marcas do modelo. Enquadre a folha inteira.");
  const m=MODEL.markerInset+MODEL.markerSize/2,canon=[{x:m,y:m},{x:layout.widthMm-m,y:m},{x:layout.widthMm-m,y:layout.heightMm-m},{x:m,y:layout.heightMm-m}],H=homography(canon,quad.points),validation=validateSheetStructure(analysis,H,layout,quad);
  if(!validation.valid){const e=Error(`Folha não confirmada: ${validation.reasons.join(", ")||"grade ilegível"}.`);e.validation=validation;throw e}
  const results=[];
  for(let c=0;c<layout.columns;c++)for(let r=0;r<layout.rowsPerColumn;r++){
    const question=questionNumber(layout,c,r);if(question>layout.questionCount)continue;
    const y=layout.firstRowY+r*MODEL.rowPitch,origin=layout.columnOrigins[c];
    const samples=layout.bubbleXs.map(x=>{const a=sampleBubble(analysis.normalized,analysis.width,analysis.height,H,origin+x,y),b=sampleBubble(analysis.enhanced,analysis.width,analysis.height,H,origin+x,y),raw=sampleBubble(analysis.gray,analysis.width,analysis.height,H,origin+x,y);return chooseBubbleEvidence(raw,a,b)});
    results.push({question,...classifyQuestion(samples,layout.alternatives,sensitivity),manual:false});
  }
  return {layout,analysis,quad,H,results,used,validation};
}
function createSelfTest(){
  const test=getSelectedTest();if(!test)return setMessage(els.scanMessage,"Escolha a prova para criar um teste.","warn");
  const l=layoutFor(test.questionCount,test.alternativeCount),scale=5,c=document.createElement("canvas");c.width=Math.ceil(l.widthMm*scale);c.height=Math.ceil(l.heightMm*scale);const ctx=c.getContext("2d");ctx.fillStyle="white";ctx.fillRect(0,0,c.width,c.height);drawSheet(canvasRenderer(ctx,scale),l,test.answers);setCurrentImageCanvas(c);setMessage(els.scanMessage,"Analisando autoteste…","ok");analyzeCurrentImage();
}
let liveTimer=null,liveBusy=false,liveStable=0,liveErrorCount=0,liveGeneration=0,livePriorCorners=null,liveLastTestId="",liveCooldown=0,liveHighRes=false;
function liveBadge(text,cls=""){if(els.liveScannerBadge){els.liveScannerBadge.textContent=text;els.liveScannerBadge.className="live-badge"+(cls?" "+cls:"")}}
function grabVideoFrame(max=V16.maxVideoSide){
  const v=els.cameraVideo;if(!v?.videoWidth||!v?.videoHeight)return null;
  const ratio=Math.min(1,max/Math.max(v.videoWidth,v.videoHeight)),c=document.createElement("canvas");
  c.width=Math.max(1,Math.round(v.videoWidth*ratio));c.height=Math.max(1,Math.round(v.videoHeight*ratio));
  c.getContext("2d",{willReadFrequently:true}).drawImage(v,0,0,c.width,c.height);return c;
}
function clearLivePolygon(){const poly=$("liveOutlinePolygon");if(poly)poly.setAttribute("points","")}
function outlineLive(pts,source){
  const svg=$("liveOutline"),polygon=$("liveOutlinePolygon"),stage=$("cameraStage"),v=els.cameraVideo;
  if(!svg||!polygon||!stage||!v.videoWidth)return;
  const w=stage.clientWidth,h=stage.clientHeight,scale=Math.min(w/v.videoWidth,h/v.videoHeight),offX=(w-v.videoWidth*scale)/2,offY=(h-v.videoHeight*scale)/2;
  svg.setAttribute("viewBox",`0 0 ${w} ${h}`);
  polygon.setAttribute("points",pts.map(p=>`${(offX+p.x*v.videoWidth/source.width*scale).toFixed(1)},${(offY+p.y*v.videoHeight/source.height*scale).toFixed(1)}`).join(" "));
}
const LIVE18 = {signature:null, confirmed:0, previewAt:0, previousPhoto:null, lastQuad:null, absence:0};
function clearAnswerOverlay(){const group=$("liveAnswerDots");if(group)group.replaceChildren();}
function resetLiveAnswers(){LIVE18.signature=null;LIVE18.confirmed=0;LIVE18.previewAt=0;clearAnswerOverlay();}
function renderAnswerOverlay(detection,test){
  // V1.8.1: somente marcações CORRETAS ficam verdes. Erros/brancos/duplas
  // continuam no diagnóstico, não criam manchas no vídeo do professor.
  const svg=$("liveOutline"),group=$("liveAnswerDots"),stage=$("cameraStage"),video=els.cameraVideo;
  if(!svg||!group||!stage||!video.videoWidth)return;
  const w=stage.clientWidth,h=stage.clientHeight,scale=Math.min(w/video.videoWidth,h/video.videoHeight);
  const offX=(w-video.videoWidth*scale)/2,offY=(h-video.videoHeight*scale)/2;
  svg.setAttribute("viewBox",`0 0 ${w} ${h}`);
  const fragment=document.createDocumentFragment(),radius=clamp(Math.min(w,h)/85,4,12);
  for(const row of detection.results){
    const i=row.question-1,answer=test.answers[i];
    if(test.annulled?.[i]||row.status!=="marked"||row.detected!==answer)continue;
    const col=Math.floor(i/detection.layout.rowsPerColumn),line=i%detection.layout.rowsPerColumn;
    const yy=detection.layout.firstRowY+line*MODEL.rowPitch;
    const j=detection.layout.alternatives.indexOf(answer);
    if(j<0)continue;
    const mapped=mapH(detection.H,detection.layout.columnOrigins[col]+detection.layout.bubbleXs[j],yy);
    const x=offX+mapped.x*video.videoWidth/detection.analysis.width*scale;
    const y=offY+mapped.y*video.videoHeight/detection.analysis.height*scale;
    if(!Number.isFinite(x)||!Number.isFinite(y))continue;
    const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");
    circle.setAttribute("cx",x.toFixed(2));circle.setAttribute("cy",y.toFixed(2));
    circle.setAttribute("r",radius.toFixed(2));circle.setAttribute("fill","#25c85f");
    circle.setAttribute("fill-opacity",".72");circle.setAttribute("stroke","#fff");
    circle.setAttribute("stroke-width","1.35");fragment.append(circle);
  }
  group.replaceChildren(fragment);
}
function correctionSignature(d){return d.results.map(r=>`${r.status}:${r.detected}`).join("|")}
function stopLiveCheck(){liveGeneration++;if(liveTimer)clearTimeout(liveTimer);liveTimer=null;liveStable=0;livePriorCorners=null;liveErrorCount=0;liveHighRes=false;clearLivePolygon();resetLiveAnswers()}
function getPreviewQuad(frame,test,maxSide=620){
  // Fase rápida: localiza 4 marcas e confere amostras da grade sem ler toda a prova.
  const l=layoutFor(test.questionCount,test.alternativeCount),a=getAnalysisImage(frame,maxSide);
  const tryQuad=(gray)=>{
    const comps=findDarkComponents(gray,a.width,a.height);
    const likely=comps.filter(p=>p.fill>.48&&p.w/p.h>.55&&p.w/p.h<1.85).slice(0,42);
    return chooseMarkerQuad(likely.length>=4?likely:comps.slice(0,42),l,a.width,a.height);
  };
  let q=tryQuad(a.normalized),field=a.normalized;
  if(!q){field=adaptiveNormalize(a.gray,a.width,a.height);q=tryQuad(field)}
  if(!q||q.confidence<.24||q.areaNorm<.009)throw Error("marcas não confirmadas");
  const m=MODEL.markerInset+MODEL.markerSize/2;
  const H=homography([{x:m,y:m},{x:l.widthMm-m,y:m},{x:l.widthMm-m,y:l.heightMm-m},{x:m,y:l.heightMm-m}],q.points);
  let hits=0,total=0;
  for(let col=0;col<l.columns;col++){
    const rows=[0,Math.floor((l.rowsPerColumn-1)/3),Math.floor(2*(l.rowsPerColumn-1)/3),l.rowsPerColumn-1];
    for(const row of new Set(rows)){
      if(questionNumber(l,col,row)>l.questionCount)continue;
      for(const xx of l.bubbleXs){const st=bubbleStructure(field,a.width,a.height,H,l.columnOrigins[col]+xx,l.firstRowY+row*MODEL.rowPitch);total++;if(st.valid)hits++}
    }
  }
  if(hits/Math.max(1,total)<.55)throw Error("grade ainda não confirmada");
  return{quad:q,analysis:a,gridRatio:hits/Math.max(1,total)};
}
async function openCamera(){
  const t=getSelectedTest();if(!t)return setMessage(els.scanMessage,"Escolha uma prova.","warn");
  if(!window.isSecureContext&&!['localhost','127.0.0.1'].includes(location.hostname))return setMessage(els.scanMessage,"A câmera exige HTTPS.","error");
  if(!navigator.mediaDevices?.getUserMedia)return setMessage(els.scanMessage,"Câmera indisponível neste navegador. Use Enviar foto.","error");
  if(state.cameraStream)return;
  stopLiveCheck();const requestGeneration=liveGeneration;els.cameraModal.classList.remove("hidden");liveBadge("Abrindo câmera…");
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}},audio:false});
    // Não manter a câmera aberta se o usuário saiu da tela enquanto a permissão era solicitada.
    if(requestGeneration!==liveGeneration||!document.getElementById("view-correct").classList.contains("active")){stream.getTracks().forEach(t=>t.stop());els.cameraModal.classList.add("hidden");return}
    state.cameraStream=stream;els.cameraVideo.srcObject=stream;await els.cameraVideo.play();state.usedCamera=true;
    if(els.sequenceMode)els.sequenceMode.checked=true;
    refreshCameraPermissionStatus();liveBadge("Procurando gabarito…");els.cameraMessage.textContent="";
    const gen=++liveGeneration;liveTimer=setTimeout(()=>liveCheck(gen),110);
  }catch(e){console.warn("Câmera:",e);closeCamera();setMessage(els.scanMessage,e.name==="NotAllowedError"?"Câmera bloqueada. Permita nas configurações do navegador.":"Não consegui abrir a câmera; você também pode enviar uma foto.","error");refreshCameraPermissionStatus()}
}
function closeCamera(){stopLiveCheck();if(state.cameraStream){state.cameraStream.getTracks().forEach(t=>t.stop());state.cameraStream=null}if(els.cameraVideo)els.cameraVideo.srcObject=null;els.cameraModal.classList.add("hidden")}
function capturePhoto(){const frame=grabVideoFrame(2400);if(!frame)return;closeCamera();setCurrentImageCanvas(frame);setMessage(els.scanMessage,"Analisando imagem…","ok");analyzeCurrentImage()}
function commitLiveDetection(frame,t,detection){
  closeCamera();setCurrentImageCanvas(frame);state.lastDetection=detection;state.lastValidation=detection.validation;state.currentCorrectionId=null;
  showRecognition(detection.validation);drawDetectionOverlay(detection);renderResults(t,detection.results,{readOnly:!!els.readOnlyMode.checked});
  const pending=detection.results.filter(x=>x.status==="review"||x.status==="multiple"||x.status==="blank").length;
  const allBlank=detection.results.every(x=>x.status==="blank");
  setMessage(els.scanMessage,allBlank?"Nenhuma resposta marcada nesta folha.":pending?`${pending} pendência(s) para conferir.`:"Corrigido e salvo.",(pending||allBlank)?"warn":"ok");
  els.resultPanel.scrollIntoView({behavior:"smooth",block:"start"});
}
function liveCheck(gen){
  if(gen!==liveGeneration||!state.cameraStream||els.cameraModal.classList.contains("hidden")||liveBusy)return;
  liveBusy=true;const begun=performance.now();let delay=V16.liveInterval;
  try{
    const test=getSelectedTest(),frame=grabVideoFrame(900);
    if(!test||!frame){liveBadge("Selecione a prova");return}
    if(test.id!==liveLastTestId){liveLastTestId=test.id;livePriorCorners=null;liveStable=0;resetLiveAnswers()}
    let fast;
    try{fast=getPreviewQuad(frame,test,liveHighRes?740:580)}
    catch(err){
      LIVE18.absence++;
      throw err;
    }
    const corners=fast.quad.points;
    outlineLive(corners,fast.analysis);
    const norm=corners.map(p=>({x:p.x/fast.analysis.width,y:p.y/fast.analysis.height}));
    const stable=livePriorCorners&&norm.every((p,i)=>Math.hypot(p.x-livePriorCorners[i].x,p.y-livePriorCorners[i].y)<.040);
    liveStable=stable?liveStable+1:1;livePriorCorners=norm;liveErrorCount=0;LIVE18.absence=0;
    if(liveStable<2){resetLiveAnswers();liveBadge("Folha encontrada…","good");return}
    // A grade já foi localizada; executa a leitura real e pinta as alternativas
    // em suas coordenadas projetadas na imagem AO VIVO.
    const hi=grabVideoFrame(1550);
    if(!hi)throw Error("Câmera sem quadro");
    const detection=scanSheet(hi,test,Number(els.markSensitivity.value)/100);
    renderAnswerOverlay(detection,test);
    const signature=correctionSignature(detection);
    if(signature===LIVE18.signature)LIVE18.confirmed++;
    else{LIVE18.signature=signature;LIVE18.confirmed=1;LIVE18.previewAt=performance.now()}
    const pending=detection.results.filter(r=>r.status==="multiple"||r.status==="review"||r.status==="blank").length;
    liveBadge(pending?`Reconhecido • ${pending} pendência(s)`:'Reconhecido • confirmando…',pending?'warn':'good');
    els.cameraMessage.textContent='';
    // O professor vê as cores por tempo suficiente; só então conclui.
    if(LIVE18.confirmed>=2){
      commitLiveDetection(hi,test,detection);
      return;
    }
    delay=190;
  }catch(err){
    liveStable=0;livePriorCorners=null;resetLiveAnswers();clearLivePolygon();liveErrorCount++;
    if(liveErrorCount>=3)liveHighRes=true;
    liveBadge(liveErrorCount>3?'Aproxime ou melhore a iluminação':'Procurando gabarito…',liveErrorCount>3?'warn':'');
    els.cameraMessage.textContent='';
    delay=liveErrorCount>3?390:220;
  }finally{
    liveBusy=false;
    if(gen===liveGeneration&&state.cameraStream){liveTimer=setTimeout(()=>liveCheck(gen),Math.max(75,delay-(performance.now()-begun)))}
  }
}
function resultIdentityUpdate(){const name=els.studentId.value.trim(),series=els.studentSeries.value.trim();els.resultStudentName.textContent=name||"Nome não informado";els.resultStudentSeries.textContent=series?`Série/turma: ${series}`:"Série/turma não informada"}
function renderResults(test,rows,opts={}){
  renderResultsV151(test,rows,opts);resultIdentityUpdate();
  const s=summarizeResults(test,rows),pending=(s.pending??(s.review+s.multiple+s.blank))>0;
  els.resultDetails.open=false;state.reviewOnlyFilter=false;applyReviewFilter();els.reviewOnlyBtn.textContent=pending?"Conferir pendências":"Ver questões";
  els.resultHelp.textContent=pending?`${s.pending} pendência(s): ${s.blank} em branco, ${s.multiple} dupla(s), ${s.review} leitura(s) duvidosa(s).`:"Correção concluída. Abra os detalhes para analisar cada questão.";
  if(els.ocrState)els.ocrState.textContent="Nome e turma opcionais";
}
function startNextCorrection(){
  V16.ocrSerial++;state.currentImageCanvas=null;state.currentResults=[];state.currentCorrectionId=null;state.lastDetection=null;state.currentQuality=null;state.lastValidation=null;state.activeResultTest=null;state.currentReadOnly=false;els.studentId.value="";els.studentSeries.value="";els.ocrState.textContent="Aguardando leitura";resultIdentityUpdate();els.photoCanvas.classList.add("hidden");els.imagePlaceholder.classList.remove("hidden");els.resultPanel.classList.add("hidden");els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;showRecognition();updatePhotoQuality();setMessage(els.scanMessage,"Pronto para a próxima prova.","ok");if(els.sequenceMode.checked||state.usedCamera)openCamera();
}
function analyzeCurrentImage(){
  const t=getSelectedTest();if(!t)return setMessage(els.scanMessage,"Selecione primeiro a prova deste lote.","warn");if(!state.currentImageCanvas)return setMessage(els.scanMessage,"Abra o scanner ou envie uma imagem.","warn");
  els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;els.analyzeBtn.textContent="Corrigindo…";setMessage(els.scanMessage,"Validando os quatro cantos, a grade e as marcações…");
  setTimeout(()=>{
    try{const detection=scanSheet(state.currentImageCanvas,t,Number(els.markSensitivity.value)/100);state.lastDetection=detection;state.lastValidation=detection.validation;state.currentCorrectionId=null;showRecognition(detection.validation);drawDetectionOverlay(detection);renderResults(t,detection.results,{readOnly:!!els.readOnlyMode.checked});const pending=detection.results.filter(r=>r.status==="review"||r.status==="multiple"||r.status==="blank").length;
      const allBlank=detection.results.every(r=>r.status==="blank");
      setMessage(els.scanMessage,allBlank?"Nenhuma resposta marcada nesta folha.":pending?`Corrigido! ${pending} pendência(s) para conferir.`:"Gabarito reconhecido e corrigido automaticamente.",(pending||allBlank)?"warn":"ok");els.resultPanel.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(e){console.error(e);els.resultPanel.classList.add("hidden");if(e.validation)showRecognition(e.validation,true);setMessage(els.scanMessage,e.message||"Não consegui validar o gabarito.","error")}
    finally{els.analyzeBtn.disabled=false;els.reprocessBtn.disabled=false;els.analyzeBtn.textContent="Analisar imagem enviada"}
  },30);
}
// V1.8.4: reconhecimento automático de nome e turma removido para manter o app leve.
function toggleReviewOnly(){
  const currentlyFiltered=!!state.reviewOnlyFilter;
  els.resultDetails.open=true;
  state.reviewOnlyFilter=!currentlyFiltered;
  applyReviewFilter();
  els.resultDetails.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function switchView(name){
 if(name!=="correct"&&state.cameraStream)closeCamera();
 els.views.forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));els.navButtons.forEach(b=>b.classList.toggle("active",b.dataset.view===name));
 state.settings.currentView=name;saveSettings();if(name==="home")updateHome();if(name==="generator"){renderLinkedTestSelect();renderGenerator()}
 if(name==="register")renderTests();if(name==="correct"){renderScanSelect();updateSelectedTestInfo();renderHistory();updateBatchStatus()}
 if(name==="data"){updateDataStats();renderStatsDashboard()}window.scrollTo({top:0,behavior:"smooth"});
}

let genTimer=null;els.navButtons.forEach(b=>b.addEventListener("click",()=>{switchView(b.dataset.view);if(b.dataset.view==="correct"&&getSelectedTest()&&!state.cameraStream&&!state.currentResults.length)openCamera()}));
els.genQuestionCount.addEventListener("input",()=>{clearTimeout(genTimer);const n=Number.parseInt(els.genQuestionCount.value,10);if(Number.isFinite(n)&&n>=1&&n<=50)genTimer=setTimeout(()=>renderGenerator(false),120)});els.genQuestionCount.addEventListener("blur",()=>renderGenerator(true));els.genAlternativeCount.addEventListener("change",()=>renderGenerator(false));els.downloadPdfBtn.addEventListener("click",generatePdf);els.downloadPngBtn.addEventListener("click",downloadPng);
els.newTestBtn.addEventListener("click",()=>openEditor());els.emptyNewTestBtn.addEventListener("click",()=>openEditor());els.cancelEditorBtn.addEventListener("click",closeEditor);let editorTimer=null;els.testQuestionCount.addEventListener("input",()=>{clearTimeout(editorTimer);const q=getEditorQuestionCount();if(q)editorTimer=setTimeout(()=>renderAnswerGrid(false),120)});els.testQuestionCount.addEventListener("blur",()=>renderAnswerGrid(true));els.testAlternativeCount.addEventListener("change",()=>renderAnswerGrid(false));els.answerKeyGrid.addEventListener("click",e=>{const annul=e.target.closest("button[data-annul-index]");if(annul){const i=Number(annul.dataset.annulIndex);state.draftAnnulled[i]=!state.draftAnnulled[i];renderAnswerGrid(false);return}const b=e.target.closest(".choice-btn");if(!b)return;state.draftAnswers[Number(b.dataset.index)]=b.dataset.letter;renderAnswerGrid(false)});els.saveTestBtn.addEventListener("click",saveCurrentTest);els.testsList.addEventListener("click",e=>{const b=e.target.closest("button[data-action]");if(!b)return;const t=state.tests.find(x=>x.id===b.dataset.id);if(b.dataset.action==="edit"&&t)openEditor(t);if(b.dataset.action==="duplicate")duplicateTest(b.dataset.id);if(b.dataset.action==="delete")deleteTest(b.dataset.id);if(b.dataset.action==="correct"&&t){switchView("correct");els.scanTestSelect.value=t.id;updateSelectedTestInfo()}});

/* ======================= GABARITA V1.8.4 =======================
   Identificação manual opcional. Nenhum OCR/HTR é carregado.
   O leitor de bolinhas e a correção automática permanecem inalterados.
*/
function updateBatchStatus(){
  if(!els.batchStatus)return;
  els.batchStatus.textContent=`Lote atual: ${state.batchCount} correç${state.batchCount===1?'ão':'ões'}`;
}
function autosaveCurrentCorrection(test){
  const isNew=!state.currentCorrectionId,summary=summarizeResults(test,state.currentResults),now=new Date().toISOString();
  if(!state.currentCorrectionId)state.currentCorrectionId=uid('correcao');
  const previous=state.history.find(x=>x.id===state.currentCorrectionId);
  const record={id:state.currentCorrectionId,testId:test.id,testName:test.name,className:test.className||'',studentId:els.studentId.value.trim(),studentSeries:els.studentSeries?.value.trim()||'',createdAt:previous?.createdAt||now,updatedAt:now,questionCount:test.questionCount,alternativeCount:test.alternativeCount,maxScore:test.maxScore,annulledAwardPoint:test.annulledAwardPoint,officialAnswers:[...test.answers],annulled:[...test.annulled],quality:state.currentQuality?{...state.currentQuality}:null,validation:state.lastValidation?{overall:state.lastValidation.overall,marker:state.lastValidation.marker,grid:state.lastValidation.grid,border:state.lastValidation.border}:null,rows:state.currentResults.map(r=>({question:r.question,detected:r.detected,status:r.status,manual:!!r.manual,confidence:r.confidence||0,reason:r.reason||''})),summary};
  const idx=state.history.findIndex(x=>x.id===record.id);idx>=0?state.history[idx]=record:state.history.unshift(record);state.history.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));if(isNew)state.batchCount++;saveHistory();renderHistory();updateBatchStatus();els.resultSavedBadge.textContent='Salvo automaticamente';
}
function renderHistory(){
  populateHistoryFilters();els.historyList.innerHTML='';const items=filteredHistory();els.historyEmpty.classList.toggle('hidden',items.length>0);els.historyEmpty.textContent=state.history.length&&!items.length?'Nenhuma correção corresponde aos filtros.':'Nenhuma correção salva ainda.';
  items.slice(0,60).forEach(item=>{const card=document.createElement('div');card.className='history-item';const d=new Date(item.updatedAt||item.createdAt),s=item.summary||{},pending=s.pending??((s.review||0)+(s.multiple||0)+(s.blank||0));
    const who=item.studentId?escapeHtml(item.studentId):'Aluno não informado';
    const series=item.studentSeries?` • ${escapeHtml(item.studentSeries)}`:'';
    card.innerHTML=`<strong></strong><div class="history-meta">${item.className?`Turma da prova: ${escapeHtml(item.className)}<br>`:''}${who}${series}<br>${Number.isNaN(d.getTime())?'':d.toLocaleString('pt-BR')}<br>${item.questionCount} questões • ${pending} pendência${pending===1?'':'s'}</div><div class="history-score">${s.correct||0} acertos • ${s.percent||0}% • Nota ${formatNumber(s.grade,2)}</div><div class="history-actions"><button class="mini-btn" data-history-action="view" data-id="${item.id}">Ver resultado</button><button class="mini-btn danger" data-history-action="delete" data-id="${item.id}">Excluir</button></div>`;card.querySelector('strong').textContent=item.testName||'Gabarito';els.historyList.appendChild(card)});updateDataStats();updateHome();
}
function startNextCorrection(){
  state.currentImageCanvas=null;state.currentResults=[];state.currentCorrectionId=null;state.lastDetection=null;state.currentQuality=null;state.lastValidation=null;state.activeResultTest=null;state.currentReadOnly=false;els.studentId.value='';els.studentSeries.value='';if(els.ocrState)els.ocrState.textContent='Identificação opcional';resultIdentityUpdate();els.photoCanvas.classList.add('hidden');els.imagePlaceholder.classList.remove('hidden');els.resultPanel.classList.add('hidden');els.analyzeBtn.disabled=true;els.reprocessBtn.disabled=true;showRecognition();updatePhotoQuality();
  setMessage(els.scanMessage,'Pronto para a próxima prova.','ok');if(els.sequenceMode.checked||state.usedCamera)openCamera();
}
function viewHistory(id){
  const item=state.history.find(x=>x.id===id);if(!item)return;const test=testFromHistory(item);state.currentReadOnly=false;state.currentCorrectionId=item.id;state.currentResults=(item.rows||[]).map(r=>({...r}));els.studentId.value=item.studentId||'';if(els.studentSeries)els.studentSeries.value=item.studentSeries||'';if(state.tests.some(t=>t.id===item.testId)){els.scanTestSelect.value=item.testId;updateSelectedTestInfo()}renderResults(test,state.currentResults,{skipSave:true,readOnly:false});els.resultSavedBadge.textContent='Resultado salvo';if(els.ocrState)els.ocrState.textContent='Nome e turma opcionais';els.resultPanel.scrollIntoView({behavior:'smooth',block:'start'});
}
function deleteHistory(id){
  if(!confirm('Excluir esta correção do histórico?'))return;state.history=state.history.filter(x=>x.id!==id);saveHistory();renderHistory();updateBatchStatus();
}
/* ===================== FIM GABARITA V1.8.4 ===================== */

els.scanTestSelect.addEventListener("change",()=>{updateSelectedTestInfo();if(getSelectedTest()&&!state.cameraStream&&!state.currentResults.length)openCamera()});els.studentId.addEventListener("input",()=>{state.settings.studentId=els.studentId.value;saveSettings()});els.sequenceMode.addEventListener("change",()=>{state.settings.sequenceMode=els.sequenceMode.checked;saveSettings()});els.takePhotoBtn.addEventListener("click",openCamera);els.chooseImageBtn.addEventListener("click",chooseImage);els.selfTestBtn.addEventListener("click",createSelfTest);els.imageFileInput.addEventListener("change",e=>loadImageFile(e.target.files?.[0]));els.closeCameraBtn.addEventListener("click",closeCamera);els.capturePhotoBtn.addEventListener("click",capturePhoto);els.cameraModal.addEventListener("click",e=>{if(e.target===els.cameraModal)closeCamera()});els.markSensitivity.addEventListener("input",()=>{els.sensitivityValue.textContent=`${els.markSensitivity.value}%`;state.settings.sensitivity=Number(els.markSensitivity.value);saveSettings()});els.analyzeBtn.addEventListener("click",analyzeCurrentImage);els.nextCorrectionBtn.addEventListener("click",startNextCorrection);els.resultRows.addEventListener("click",e=>{const b=e.target.closest("button[data-review-index]");if(b)applyManualReview(Number(b.dataset.reviewIndex),b.dataset.reviewValue)});els.exportCurrentCsvBtn.addEventListener("click",exportCurrentCsv);els.exportCurrentPdfBtn.addEventListener("click",exportCurrentPdf);els.historyList.addEventListener("click",e=>{const b=e.target.closest("button[data-history-action]");if(!b)return;b.dataset.historyAction==="view"?viewHistory(b.dataset.id):deleteHistory(b.dataset.id)});els.exportHistoryCsvBtn.addEventListener("click",exportHistoryCsv);els.dataExportHistoryBtn.addEventListener("click",exportHistoryCsv);els.exportBackupBtn.addEventListener("click",exportBackup);els.importBackupBtn.addEventListener("click",()=>{els.backupFileInput.value="";els.backupFileInput.click()});els.backupFileInput.addEventListener("change",e=>importBackupFile(e.target.files?.[0]));els.clearHistoryBtn.addEventListener("click",clearHistory);els.installAppBtn.addEventListener("click",installApp);els.persistStorageBtn.addEventListener("click",requestPersistentStorage);window.addEventListener("online",updateOnlineStatus);window.addEventListener("offline",updateOnlineStatus);window.addEventListener("beforeunload",closeCamera);
document.querySelectorAll("[data-home-view]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.homeView)));
els.readOnlyMode?.addEventListener("change",()=>{state.settings.readOnlyMode=els.readOnlyMode.checked;saveSettings()});
els.reprocessBtn?.addEventListener("click",analyzeCurrentImage);els.reviewOnlyBtn?.addEventListener("click",toggleReviewOnly);
els.showAllDetailsBtn?.addEventListener("click",()=>{state.reviewOnlyFilter=false;applyReviewFilter();els.resultDetails.open=true;els.resultDetails.scrollIntoView({behavior:"smooth",block:"start"})});
[els.historySearch,els.historyTestFilter,els.historyPeriod,els.historyOnlyReview].filter(Boolean).forEach(el=>el.addEventListener(el.tagName==="INPUT"&&el.type==="search"?"input":"change",()=>{state.settings.historySearch=els.historySearch?.value||"";state.settings.historyTestFilter=els.historyTestFilter?.value||"";state.settings.historyPeriod=els.historyPeriod?.value||"all";state.settings.historyOnlyReview=!!els.historyOnlyReview?.checked;saveSettings();renderHistory()}));
els.statsTestSelect?.addEventListener("change",()=>{state.settings.statsTestId=els.statsTestSelect.value;saveSettings();renderStatsDashboard()});els.exportStatsCsvBtn?.addEventListener("click",exportStatsCsv);els.restoreAutoBackupBtn?.addEventListener("click",restoreAutoBackup);
els.genLinkedTest?.addEventListener("change",()=>{state.settings.generatorLinkedTestId=els.genLinkedTest.value;saveSettings();renderGenerator(true)});
els.testsList.addEventListener("click",e=>{const b=e.target.closest('button[data-action="generate"]');if(!b)return;const t=state.tests.find(x=>x.id===b.dataset.id);if(!t)return;state.settings.generatorLinkedTestId=t.id;saveSettings();switchView("generator");renderLinkedTestSelect();els.genLinkedTest.value=t.id;renderGenerator(true)});
els.studentId.addEventListener("input",()=>{resultIdentityUpdate();if(state.activeResultTest&&state.currentResults.length&&!state.currentReadOnly)autosaveCurrentCorrection(state.activeResultTest)});
els.studentSeries.addEventListener("input",()=>{resultIdentityUpdate();if(state.activeResultTest&&state.currentResults.length&&!state.currentReadOnly)autosaveCurrentCorrection(state.activeResultTest)});
ensureUniqueSheetCodes();
// V1.8.4: o reconhecimento automático de nome/turma foi removido.
// Mantemos apenas os textos que o professor já tinha salvo manualmente ou em versões anteriores.
let cleanedIdentity=false;
state.history.forEach(item=>{
  for(const key of ['identityStatus','identityEngine','identityConfidence','identityUpdatedAt','identityManualName','identityManualSeries']){if(key in item){delete item[key];cleanedIdentity=true;}}
});
if(cleanedIdentity)saveHistory();
// Migração do histórico anterior: corrigir a contagem armazenada sem alterar
// as leituras manuais, notas ou identificações já registradas.
let repairedPending=false;
state.history.forEach(item=>{
  const s=item.summary||{}, expected=(s.blank||0)+(s.multiple||0)+(s.review||0);
  if(s.pending!==expected){item.summary={...s,pending:expected};repairedPending=true;}
});
if(repairedPending)saveHistory();
function startGabaritaApp(){
  restoreSettings();els.studentId.value="";els.studentSeries.value="";state.settings.studentId="";saveSettings();
  renderGenerator(true);renderTests();renderHistory();updatePhotoQuality();updateOnlineStatus();refreshCameraPermissionStatus();registerServiceWorker();
  switchView(["home","generator","register","correct","data"].includes(state.settings.currentView)?state.settings.currentView:"home");
}
window.addEventListener("DOMContentLoaded",async()=>{
  try{
    const licensed=window.GabaritaLicense?await window.GabaritaLicense.requireValid():false;
    if(licensed)startGabaritaApp();
    else window.addEventListener("gabarita:licensed",()=>startGabaritaApp(),{once:true});
  }catch(e){console.error("Licença:",e);}
});

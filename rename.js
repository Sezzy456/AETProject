const fs = require('fs');

const replacements = {
    'spineMoveCard': 'ceMoveCard',
    'spineDeleteCard': 'ceDeleteCard',
    'spineAddSection': 'ceAddSection',
    'spineAddCard': 'ceAddCard',
    'spineChangeCardEntity': 'ceChangeCardEntity',
    'spineChangeCardFormat': 'ceChangeCardFormat',
    'setupSpineEditToggle': 'setupCeEditToggle',
    'setupSpineDragAndDrop': 'setupCeDragAndDrop',
    'persistSpineEdits': 'persistCeEdits',
    'renderSpineCards': 'renderContentCards',
    'spine-edit-toggle': 'ce-edit-toggle',
    'spine-cancel-btn': 'ce-cancel-btn',
    'spine-edit-active': 'ce-edit-active',
    'spine-edit-ctrl': 'ce-edit-ctrl',
    'spine-width-select': 'ce-width-select',
    'spine-entity-select': 'ce-entity-select',
    'spine-format-select': 'ce-format-select',
    'spine-section-title': 'ce-section-title',
    'spine-edit-sec-title': 'ce-edit-sec-title',
    'spine-card-title': 'ce-card-title',
    'spine-edit-card-title': 'ce-edit-card-title',
    'spine-card-content': 'ce-card-content',
    'spine-edit-card-content': 'ce-edit-card-content',
    'spine-drag-grip': 'ce-drag-grip',
    'spine-section-row': 'ce-section-row',
    'spine-dragging': 'ce-dragging',
    'spine-drag-over': 'ce-drag-over',
    'isSpineEditMode': 'isCeEditMode',
    '_spinePendingReorders': '_cePendingReorders'
};

const files = [
    'js/app.js',
    'pages/strategy_spine.html'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    for (const [oldVal, newVal] of Object.entries(replacements)) {
        // We use string replacement globally by regex
        const regex = new RegExp(oldVal.replace(/-/g, '\\-'), 'g');
        content = content.replace(regex, newVal);
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
});

let applicationGraph;
let applicationPaper;
// The current application being edited
let currentApplication;

function initializeApplicationEditor() {
    const select = $('#applications');
    select.selectmenu();
    select.append($("<option />").val('none').text(''));

    applicationGraph = new joint.dia.Graph;
    applicationPaper = new joint.dia.Paper({
        el: $('#executionDesigner'),
        model: applicationGraph,
        height: 800,
        width: '95%',
        gridSize: 1,
        defaultLink: new joint.dia.Link({
            attrs: {'.marker-target': {d: 'M 10 0 L 0 5 L 10 10 z'}}
        })
        // allowLink: handleLinkEvent,
        // validateConnection: function (cellViewS, magnetS, cellViewT, magnetT) {
        //     if (getConnectedLinks(cellViewT.model, V(magnetT).attr('port')) > 0) return false;
        //     // Prevent linking from input ports.
        //     if (magnetS && magnetS.getAttribute('port-group') === 'in') return false;
        //     // Prevent linking from output ports to input ports within one element.
        //     if (cellViewS === cellViewT) return false;
        //     // Prevent linking to input ports.
        //     return magnetT && magnetT.getAttribute('port-group') === 'in';
        // },
        // validateMagnet: function (cellView, magnet) {
        //     if (getConnectedLinks(cellView.model, V(magnet).attr('port')) > 0) return false;
        //     if (magnet.getAttribute('magnet') !== 'passive') return true;
        // }
    });

    $('#edit-application-button').click(displayEditApplicationButton);
    $('#new-application-button').click(handleNewApplication);
}

function displayEditApplicationButton() {
    // TODO Add save and cancel functions
    // TODO Ensure there is an application to work with
    if (!currentApplication) {
        showAlertDialog('Please select or create an application!');
    } else {
        showSettingsDialog();
    }
}

function handleNewApplication() {
    if (currentApplication) {
        showClearFormDialog(function() {
            showNewDialog(setupNewApplication);
        });
    } else {
        showNewDialog(setupNewApplication);
    }
}

function setupNewApplication(name) {
    currentApplication = {
        name: name
    };
    $('#applicationName').text(currentApplication.name);
}

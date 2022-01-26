#!/usr/bin/env node

const dcmjsDimse = require('dcmjs-dimse');
const { Server, Scp } = dcmjsDimse;
const { CEchoResponse, CFindResponse, CStoreResponse } = dcmjsDimse.responses;
const {
  Status,
  PresentationContextResult,
  RejectResult,
  RejectSource,
  RejectReason,
  TransferSyntax,
  SopClass,
  StorageClass,
} = dcmjsDimse.constants;

const port = 11112;

const AcceptedTransferSyntax = {
    '1.2.840.10008.1.2': 'ImplicitVRLittleEndian',
    '1.2.840.10008.1.2.1': 'ExplicitVRLittleEndian',
    '1.2.840.10008.1.2.5': 'RleLossless',
    '1.2.840.10008.1.2.4.50': 'JpegBaseline',
    '1.2.840.10008.1.2.4.70': 'JpegLossless',
    '1.2.840.10008.1.2.4.80': 'JpegLsLossless',
    '1.2.840.10008.1.2.4.81': 'JpegLsLossy',
    '1.2.840.10008.1.2.4.100': 'mpeg',
    '1.2.840.10008.1.2.4.101': 'mpeg',
    '1.2.840.10008.1.2.4.102': 'h264',
    '1.2.840.10008.1.2.4.103': 'h264',
  };  

class DcmjsDimseScp extends Scp {
  constructor(socket, opts) {
    super(socket, opts);
    this.association = undefined;
  }

  // Handle incoming association requests
  associationRequested(association) {
    this.association = association;

    // // Evaluate calling/called AET and reject association, if needed
    // if (this.association.getCallingAeTitle() !== 'SCU') {
    //   this.sendAssociationReject(
    //     RejectResult.Permanent,
    //     RejectSource.ServiceUser,
    //     RejectReason.CallingAeNotRecognized
    //   );
    //   return;
    // }

    // Optionally set the preferred max PDU length
    this.association.setMaxPduLength(65536);

    const contexts = association.getPresentationContexts();
    contexts.forEach((c) => {
      const context = association.getPresentationContext(c.id);
      if (
        context.getAbstractSyntaxUid() === SopClass.Verification ||
        Object.values(StorageClass).includes(context.getAbstractSyntaxUid())
      ) {
        const transferSyntaxes = context.getTransferSyntaxUids();
        transferSyntaxes.forEach((transferSyntax) => {
          if (AcceptedTransferSyntax[transferSyntax]) {
            context.setResult(
              PresentationContextResult.Accept,
              TransferSyntax.transferSyntax
            );
          }
        });
      } else {
        context.setResult(PresentationContextResult.RejectAbstractSyntaxNotSupported);
      }
    });
    this.sendAssociationAccept();
  }

  // Handle incoming C-ECHO requests
  cEchoRequest(request, callback) {
    const response = CEchoResponse.fromRequest(request);
    response.setStatus(Status.Success);
    
    callback(response);
  }

  // Handle incoming C-STORE requests
  cStoreRequest(request, callback) {
    console.log(request.getDataset().getDenaturalizedDataset());
    console.log(Object.keys(request));

    const response = CStoreResponse.fromRequest(request);
    response.setStatus(Status.Success);

    callback(response);
  }

  // Handle incoming association release requests
  associationReleaseRequested() {
    this.sendAssociationReleaseResponse();
  }
}

const server = new Server(DcmjsDimseScp);
server.on('networkError', (e) => {
  console.log('Network error: ', e);
});
console.log(`Starting server listen on port ${port}`)
server.listen(port);

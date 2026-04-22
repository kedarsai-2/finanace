package com.finance.app.web.rest;

import com.finance.app.domain.Party;
import com.finance.app.repository.PartyRepository;
import com.finance.app.service.PartyLedgerService;
import com.finance.app.service.dto.PartyLedgerEntryDTO;
import com.finance.app.web.rest.errors.BadRequestAlertException;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PartyLedgerResource {

    private final PartyLedgerService partyLedgerService;
    private final PartyRepository partyRepository;

    public PartyLedgerResource(PartyLedgerService partyLedgerService, PartyRepository partyRepository) {
        this.partyLedgerService = partyLedgerService;
        this.partyRepository = partyRepository;
    }

    /**
     * {@code GET /party-ledger?businessId=123&partyId=456} : Get computed ledger entries for a party.
     */
    @GetMapping("/party-ledger")
    public ResponseEntity<List<PartyLedgerEntryDTO>> getPartyLedger(
        @RequestParam("businessId") Long businessId,
        @RequestParam("partyId") Long partyId
    ) {
        if (businessId == null || partyId == null) {
            throw new BadRequestAlertException("Missing businessId/partyId", "partyLedger", "missingids");
        }

        Party party = partyRepository
            .findById(partyId)
            .orElseThrow(() -> new BadRequestAlertException("Party not found", "partyLedger", "partynotfound"));
        if (party.getBusiness() == null || party.getBusiness().getId() == null || !party.getBusiness().getId().equals(businessId)) {
            throw new BadRequestAlertException("Party does not belong to business", "partyLedger", "partybusinessmismatch");
        }

        return ResponseEntity.ok(partyLedgerService.getPartyLedger(party));
    }
}

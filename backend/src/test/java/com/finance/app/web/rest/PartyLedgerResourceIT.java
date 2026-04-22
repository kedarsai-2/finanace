package com.finance.app.web.rest;

import com.finance.app.domain.Business;
import com.finance.app.domain.Party;
import com.finance.app.repository.PartyRepository;
import com.finance.app.service.PartyLedgerService;
import com.finance.app.service.dto.PartyLedgerEntryDTO;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;

class PartyLedgerResourceIT {

    @Test
    void getPartyLedgerReturnsListFromService() throws Exception {
        PartyLedgerService partyLedgerService = Mockito.mock(PartyLedgerService.class);
        PartyRepository partyRepository = Mockito.mock(PartyRepository.class);
        PartyLedgerResource resource = new PartyLedgerResource(partyLedgerService, partyRepository);

        Party party = new Party();
        party.setId(1L);
        Business biz = new Business();
        biz.setId(2L);
        party.setBusiness(biz);
        Mockito.when(partyRepository.findById(1L)).thenReturn(java.util.Optional.of(party));

        PartyLedgerEntryDTO opening = new PartyLedgerEntryDTO();
        opening.setId("le_1_opening");
        opening.setPartyId("1");
        opening.setDate(Instant.parse("2025-01-01T00:00:00Z"));
        opening.setNote("Opening balance");
        opening.setAmount(new BigDecimal("100.00"));
        opening.setType("opening");
        opening.setRefNo("OPEN");

        PartyLedgerEntryDTO inv = new PartyLedgerEntryDTO();
        inv.setId("le_inv_10");
        inv.setPartyId("1");
        inv.setDate(Instant.parse("2025-02-01T00:00:00Z"));
        inv.setNote("Invoice INV-TEST-1");
        inv.setAmount(new BigDecimal("250.00"));
        inv.setType("invoice");
        inv.setRefNo("INV-TEST-1");
        inv.setRefLink("/invoices/10");

        Mockito.when(partyLedgerService.getPartyLedger(party)).thenReturn(List.of(opening, inv));

        ResponseEntity<List<PartyLedgerEntryDTO>> res = resource.getPartyLedger(2L, 1L);
        Assertions.assertEquals(200, res.getStatusCode().value());
        Assertions.assertNotNull(res.getBody());
        Assertions.assertEquals(2, res.getBody().size());
        Assertions.assertEquals("opening", res.getBody().get(0).getType());
        Assertions.assertEquals(new BigDecimal("100.00"), res.getBody().get(0).getAmount());
        Assertions.assertEquals("invoice", res.getBody().get(1).getType());
        Assertions.assertEquals("INV-TEST-1", res.getBody().get(1).getRefNo());
    }
}

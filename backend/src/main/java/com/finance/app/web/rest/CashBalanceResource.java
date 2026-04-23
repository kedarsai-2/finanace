package com.finance.app.web.rest;

import com.finance.app.service.CashBalanceService;
import com.finance.app.service.dto.CashBalanceDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cash-balance")
public class CashBalanceResource {

    private static final Logger LOG = LoggerFactory.getLogger(CashBalanceResource.class);

    private final CashBalanceService cashBalanceService;

    public CashBalanceResource(CashBalanceService cashBalanceService) {
        this.cashBalanceService = cashBalanceService;
    }

    @GetMapping("")
    public ResponseEntity<CashBalanceDTO> getCashBalance(@RequestParam("businessId") Long businessId) {
        LOG.debug("REST request to get cash balance snapshot for business {}", businessId);
        return ResponseEntity.ok(cashBalanceService.getSnapshot(businessId));
    }

    public static class CashBalanceUpdateRequest {

        @NotNull
        private Long businessId;

        @NotNull
        private BigDecimal openingBalance;

        public Long getBusinessId() {
            return businessId;
        }

        public void setBusinessId(Long businessId) {
            this.businessId = businessId;
        }

        public BigDecimal getOpeningBalance() {
            return openingBalance;
        }

        public void setOpeningBalance(BigDecimal openingBalance) {
            this.openingBalance = openingBalance;
        }
    }

    @PutMapping("")
    public ResponseEntity<CashBalanceDTO> updateOpeningBalance(@Valid @RequestBody CashBalanceUpdateRequest req) {
        LOG.debug("REST request to set opening cash balance for business {}", req.getBusinessId());
        return ResponseEntity.ok(cashBalanceService.setOpeningBalance(req.getBusinessId(), req.getOpeningBalance()));
    }
}


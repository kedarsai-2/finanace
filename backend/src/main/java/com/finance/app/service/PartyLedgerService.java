package com.finance.app.service;

import com.finance.app.domain.Expense;
import com.finance.app.domain.Invoice;
import com.finance.app.domain.Party;
import com.finance.app.domain.Payment;
import com.finance.app.domain.Purchase;
import com.finance.app.domain.enumeration.InvoiceStatus;
import com.finance.app.domain.enumeration.PaymentDirection;
import com.finance.app.domain.enumeration.PurchaseStatus;
import com.finance.app.service.dto.PartyLedgerEntryDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PartyLedgerService {

    @PersistenceContext
    private EntityManager em;

    public List<PartyLedgerEntryDTO> getPartyLedger(Party party) {
        Long businessId = party != null && party.getBusiness() != null ? party.getBusiness().getId() : null;
        Long partyId = party != null ? party.getId() : null;
        if (businessId == null || partyId == null) {
            return List.of();
        }

        List<PartyLedgerEntryDTO> out = new ArrayList<>();

        // Opening balance (if set)
        if (party.getOpeningBalance() != null && party.getOpeningBalance().compareTo(BigDecimal.ZERO) != 0) {
            PartyLedgerEntryDTO e = new PartyLedgerEntryDTO();
            e.setId("le_" + partyId + "_opening");
            e.setPartyId(String.valueOf(partyId));
            e.setDate(Optional.ofNullable(party.getCreatedAt()).orElse(Instant.now()));
            e.setNote("Opening balance");
            e.setAmount(party.getOpeningBalance());
            e.setType("opening");
            e.setRefNo("OPEN");
            e.setRefLink(null);
            out.add(e);
        }

        // Invoices (FINAL, non-deleted)
        List<Invoice> invoices = em
            .createQuery("select i from Invoice i where i.business.id = :biz and i.party.id = :party", Invoice.class)
            .setParameter("biz", businessId)
            .setParameter("party", partyId)
            .getResultList();
        for (Invoice inv : invoices) {
            if (inv.getDeleted() != null && inv.getDeleted()) continue;
            if (inv.getStatus() != InvoiceStatus.FINAL) continue;
            PartyLedgerEntryDTO e = new PartyLedgerEntryDTO();
            e.setId("le_inv_" + inv.getId());
            e.setPartyId(String.valueOf(partyId));
            e.setDate(inv.getFinalizedAt() != null ? inv.getFinalizedAt() : inv.getDate());
            e.setNote("Invoice " + inv.getNumber());
            e.setAmount(zeroSafe(inv.getTotal()));
            e.setType("invoice");
            e.setRefNo(inv.getNumber());
            e.setRefLink("/invoices/" + inv.getId());
            out.add(e);
        }

        // Purchases (FINAL, non-deleted) -> payable => negative
        List<Purchase> purchases = em
            .createQuery("select p from Purchase p where p.business.id = :biz and p.party.id = :party", Purchase.class)
            .setParameter("biz", businessId)
            .setParameter("party", partyId)
            .getResultList();
        for (Purchase p : purchases) {
            if (p.getDeleted() != null && p.getDeleted()) continue;
            if (p.getStatus() != PurchaseStatus.FINAL) continue;
            PartyLedgerEntryDTO e = new PartyLedgerEntryDTO();
            e.setId("le_pur_" + p.getId());
            e.setPartyId(String.valueOf(partyId));
            e.setDate(p.getFinalizedAt() != null ? p.getFinalizedAt() : p.getDate());
            e.setNote("Purchase " + p.getNumber());
            e.setAmount(zeroSafe(p.getTotal()).abs().negate());
            e.setType("purchase");
            e.setRefNo(p.getNumber());
            e.setRefLink("/purchases/" + p.getId());
            out.add(e);
        }

        // Payments -> IN reduces receivable (negative), OUT reduces payable (positive)
        List<Payment> payments = em
            .createQuery("select pay from Payment pay where pay.business.id = :biz and pay.party.id = :party", Payment.class)
            .setParameter("biz", businessId)
            .setParameter("party", partyId)
            .getResultList();
        for (Payment pay : payments) {
            PartyLedgerEntryDTO e = new PartyLedgerEntryDTO();
            e.setId("le_pay_" + pay.getId());
            e.setPartyId(String.valueOf(partyId));
            e.setDate(pay.getDate());
            e.setNote("Payment" + (pay.getReference() != null && !pay.getReference().isBlank() ? " " + pay.getReference() : ""));
            BigDecimal amt = zeroSafe(pay.getAmount()).abs();
            e.setAmount(pay.getDirection() == PaymentDirection.IN ? amt.negate() : amt);
            e.setType("payment");
            e.setRefNo(pay.getReference());
            e.setRefLink("/payments");
            out.add(e);
        }

        // Expenses (if linked to party) -> payable => negative
        List<Expense> expenses = em
            .createQuery("select exp from Expense exp where exp.business.id = :biz and exp.party.id = :party", Expense.class)
            .setParameter("biz", businessId)
            .setParameter("party", partyId)
            .getResultList();
        for (Expense exp : expenses) {
            if (exp.getDeleted() != null && exp.getDeleted()) continue;
            PartyLedgerEntryDTO e = new PartyLedgerEntryDTO();
            e.setId("le_exp_" + exp.getId());
            e.setPartyId(String.valueOf(partyId));
            e.setDate(exp.getDate());
            e.setNote("Expense " + exp.getCategory());
            e.setAmount(zeroSafe(exp.getAmount()).abs().negate());
            e.setType("expense");
            e.setRefNo(exp.getReference());
            e.setRefLink("/expenses/" + exp.getId());
            out.add(e);
        }

        out.sort(Comparator.comparing(PartyLedgerEntryDTO::getDate));
        return out;
    }

    private static BigDecimal zeroSafe(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}

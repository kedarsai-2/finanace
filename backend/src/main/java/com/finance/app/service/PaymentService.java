package com.finance.app.service;

import com.finance.app.domain.Account;
import com.finance.app.domain.Party;
import com.finance.app.domain.Payment;
import com.finance.app.domain.enumeration.PaymentMode;
import com.finance.app.repository.AccountRepository;
import com.finance.app.repository.PartyRepository;
import com.finance.app.repository.PaymentAllocationRepository;
import com.finance.app.repository.PaymentRepository;
import com.finance.app.service.dto.PaymentDTO;
import com.finance.app.service.mapper.PaymentMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.finance.app.domain.Payment}.
 */
@Service
@Transactional
public class PaymentService {

    private static final Logger LOG = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;

    private final PaymentAllocationRepository paymentAllocationRepository;

    private final PaymentMapper paymentMapper;

    private final CashLedgerAccountService cashLedgerAccountService;

    private final BankLedgerAccountService bankLedgerAccountService;

    private final AccountRepository accountRepository;

    private final PartyRepository partyRepository;

    public PaymentService(
        PaymentRepository paymentRepository,
        PaymentAllocationRepository paymentAllocationRepository,
        PaymentMapper paymentMapper,
        CashLedgerAccountService cashLedgerAccountService,
        BankLedgerAccountService bankLedgerAccountService,
        AccountRepository accountRepository,
        PartyRepository partyRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentAllocationRepository = paymentAllocationRepository;
        this.paymentMapper = paymentMapper;
        this.cashLedgerAccountService = cashLedgerAccountService;
        this.bankLedgerAccountService = bankLedgerAccountService;
        this.accountRepository = accountRepository;
        this.partyRepository = partyRepository;
    }

    /** Load a managed account when the client sends {@code account: { id }} so the chosen ledger is persisted. */
    private void applyAccountFromDto(Payment payment, PaymentDTO paymentDTO) {
        if (paymentDTO.getAccount() == null || paymentDTO.getAccount().getId() == null) {
            return;
        }
        Long accountId = paymentDTO.getAccount().getId();
        Account account = accountRepository
            .findById(accountId)
            .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountId));
        payment.setAccount(account);
    }

    /**
     * Save a payment.
     *
     * @param paymentDTO the entity to save.
     * @return the persisted entity.
     */
    public PaymentDTO save(PaymentDTO paymentDTO) {
        LOG.debug("Request to save Payment : {}", paymentDTO);
        Payment payment = paymentMapper.toEntity(paymentDTO);
        applyAccountFromDto(payment, paymentDTO);
        applyDefaultAccountIfMissing(payment);
        payment = paymentRepository.save(payment);
        return paymentMapper.toDto(payment);
    }

    /**
     * Update a payment.
     *
     * @param paymentDTO the entity to save.
     * @return the persisted entity.
     */
    public PaymentDTO update(PaymentDTO paymentDTO) {
        LOG.debug("Request to update Payment : {}", paymentDTO);
        Payment payment = paymentMapper.toEntity(paymentDTO);
        applyAccountFromDto(payment, paymentDTO);
        applyDefaultAccountIfMissing(payment);
        payment = paymentRepository.save(payment);
        return paymentMapper.toDto(payment);
    }

    /**
     * Partially update a payment.
     *
     * @param paymentDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<PaymentDTO> partialUpdate(PaymentDTO paymentDTO) {
        LOG.debug("Request to partially update Payment : {}", paymentDTO);

        return paymentRepository
            .findById(paymentDTO.getId())
            .map(existingPayment -> {
                applyPaymentPatch(existingPayment, paymentDTO);
                applyDefaultAccountIfMissing(existingPayment);

                return existingPayment;
            })
            .map(paymentRepository::save)
            .map(paymentMapper::toDto);
    }

    private void applyPaymentPatch(Payment payment, PaymentDTO paymentDTO) {
        if (paymentDTO.getDirection() != null) {
            payment.setDirection(paymentDTO.getDirection());
        }
        if (paymentDTO.getDate() != null) {
            payment.setDate(paymentDTO.getDate());
        }
        if (paymentDTO.getAmount() != null) {
            payment.setAmount(paymentDTO.getAmount());
        }
        if (paymentDTO.getMode() != null) {
            payment.setMode(paymentDTO.getMode());
        }
        if (paymentDTO.getReference() != null) {
            payment.setReference(paymentDTO.getReference());
        }
        if (paymentDTO.getNotes() != null) {
            payment.setNotes(paymentDTO.getNotes());
        }
        if (paymentDTO.getProofDataUrl() != null) {
            payment.setProofDataUrl(paymentDTO.getProofDataUrl());
        }
        if (paymentDTO.getProofName() != null) {
            payment.setProofName(paymentDTO.getProofName());
        }
        if (paymentDTO.getExcludeFromLedger() != null) {
            payment.setExcludeFromLedger(paymentDTO.getExcludeFromLedger());
        }
        if (paymentDTO.getParty() != null) {
            if (paymentDTO.getParty().getId() == null) {
                payment.setParty(null);
            } else {
                Party party = partyRepository
                    .findById(paymentDTO.getParty().getId())
                    .orElseThrow(() ->
                        new IllegalArgumentException("Party not found: " + paymentDTO.getParty().getId())
                    );
                payment.setParty(party);
            }
        }
        if (paymentDTO.getAccount() != null) {
            if (paymentDTO.getAccount().getId() == null) {
                payment.setAccount(null);
            } else {
                Account account = accountRepository
                    .findById(paymentDTO.getAccount().getId())
                    .orElseThrow(() ->
                        new IllegalArgumentException("Account not found: " + paymentDTO.getAccount().getId())
                    );
                payment.setAccount(account);
            }
        }
    }

    /**
     * Get all the payments with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<PaymentDTO> findAllWithEagerRelationships(Pageable pageable) {
        return paymentRepository.findAllWithEagerRelationships(pageable).map(paymentMapper::toDto);
    }

    /**
     * Get one payment by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<PaymentDTO> findOne(Long id) {
        LOG.debug("Request to get Payment : {}", id);
        return paymentRepository.findOneWithEagerRelationships(id).map(paymentMapper::toDto);
    }

    /**
     * Delete the payment by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Payment : {}", id);
        paymentAllocationRepository.deleteAllByPaymentId(id);
        paymentRepository.deleteById(id);
    }

    private void applyDefaultAccountIfMissing(Payment payment) {
        if (payment.getAccount() != null) {
            return;
        }
        if (payment.getBusiness() == null) {
            return;
        }
        Long businessId = payment.getBusiness().getId();
        if (payment.getMode() == PaymentMode.CASH) {
            payment.setAccount(cashLedgerAccountService.getOrCreateCashAccount(businessId));
        } else if (payment.getMode() == PaymentMode.BANK || payment.getMode() == PaymentMode.UPI) {
            payment.setAccount(bankLedgerAccountService.getOrCreatePrimaryBankAccount(businessId));
        }
    }
}

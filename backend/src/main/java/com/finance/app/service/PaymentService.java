package com.finance.app.service;

import com.finance.app.domain.Payment;
import com.finance.app.domain.enumeration.PaymentMode;
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

    private final PaymentMapper paymentMapper;

    private final CashLedgerAccountService cashLedgerAccountService;

    public PaymentService(PaymentRepository paymentRepository, PaymentMapper paymentMapper, CashLedgerAccountService cashLedgerAccountService) {
        this.paymentRepository = paymentRepository;
        this.paymentMapper = paymentMapper;
        this.cashLedgerAccountService = cashLedgerAccountService;
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
        if (payment.getMode() == PaymentMode.CASH && payment.getAccount() == null && payment.getBusiness() != null) {
            payment.setAccount(cashLedgerAccountService.getOrCreateCashAccount(payment.getBusiness().getId()));
        }
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
        if (payment.getMode() == PaymentMode.CASH && payment.getAccount() == null && payment.getBusiness() != null) {
            payment.setAccount(cashLedgerAccountService.getOrCreateCashAccount(payment.getBusiness().getId()));
        }
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
                paymentMapper.partialUpdate(existingPayment, paymentDTO);
                if (
                    existingPayment.getMode() == PaymentMode.CASH &&
                    existingPayment.getAccount() == null &&
                    existingPayment.getBusiness() != null
                ) {
                    existingPayment.setAccount(cashLedgerAccountService.getOrCreateCashAccount(existingPayment.getBusiness().getId()));
                }

                return existingPayment;
            })
            .map(paymentRepository::save)
            .map(paymentMapper::toDto);
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
        paymentRepository.deleteById(id);
    }
}

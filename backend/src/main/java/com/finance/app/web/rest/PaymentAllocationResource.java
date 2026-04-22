package com.finance.app.web.rest;

import com.finance.app.repository.PaymentAllocationRepository;
import com.finance.app.service.PaymentAllocationService;
import com.finance.app.service.dto.PaymentAllocationDTO;
import com.finance.app.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.finance.app.domain.PaymentAllocation}.
 */
@RestController
@RequestMapping("/api/payment-allocations")
public class PaymentAllocationResource {

    private static final Logger LOG = LoggerFactory.getLogger(PaymentAllocationResource.class);

    private static final String ENTITY_NAME = "paymentAllocation";

    @Value("${jhipster.clientApp.name:backend}")
    private String applicationName;

    private final PaymentAllocationService paymentAllocationService;

    private final PaymentAllocationRepository paymentAllocationRepository;

    public PaymentAllocationResource(
        PaymentAllocationService paymentAllocationService,
        PaymentAllocationRepository paymentAllocationRepository
    ) {
        this.paymentAllocationService = paymentAllocationService;
        this.paymentAllocationRepository = paymentAllocationRepository;
    }

    /**
     * {@code POST  /payment-allocations} : Create a new paymentAllocation.
     *
     * @param paymentAllocationDTO the paymentAllocationDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new paymentAllocationDTO, or with status {@code 400 (Bad Request)} if the paymentAllocation has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<PaymentAllocationDTO> createPaymentAllocation(@Valid @RequestBody PaymentAllocationDTO paymentAllocationDTO)
        throws URISyntaxException {
        LOG.debug("REST request to save PaymentAllocation : {}", paymentAllocationDTO);
        if (paymentAllocationDTO.getId() != null) {
            throw new BadRequestAlertException("A new paymentAllocation cannot already have an ID", ENTITY_NAME, "idexists");
        }
        paymentAllocationDTO = paymentAllocationService.save(paymentAllocationDTO);
        return ResponseEntity.created(new URI("/api/payment-allocations/" + paymentAllocationDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, paymentAllocationDTO.getId().toString()))
            .body(paymentAllocationDTO);
    }

    /**
     * {@code PUT  /payment-allocations/:id} : Updates an existing paymentAllocation.
     *
     * @param id the id of the paymentAllocationDTO to save.
     * @param paymentAllocationDTO the paymentAllocationDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated paymentAllocationDTO,
     * or with status {@code 400 (Bad Request)} if the paymentAllocationDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the paymentAllocationDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PaymentAllocationDTO> updatePaymentAllocation(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody PaymentAllocationDTO paymentAllocationDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update PaymentAllocation : {}, {}", id, paymentAllocationDTO);
        if (paymentAllocationDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, paymentAllocationDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!paymentAllocationRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        paymentAllocationDTO = paymentAllocationService.update(paymentAllocationDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, paymentAllocationDTO.getId().toString()))
            .body(paymentAllocationDTO);
    }

    /**
     * {@code PATCH  /payment-allocations/:id} : Partial updates given fields of an existing paymentAllocation, field will ignore if it is null
     *
     * @param id the id of the paymentAllocationDTO to save.
     * @param paymentAllocationDTO the paymentAllocationDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated paymentAllocationDTO,
     * or with status {@code 400 (Bad Request)} if the paymentAllocationDTO is not valid,
     * or with status {@code 404 (Not Found)} if the paymentAllocationDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the paymentAllocationDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<PaymentAllocationDTO> partialUpdatePaymentAllocation(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody PaymentAllocationDTO paymentAllocationDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update PaymentAllocation partially : {}, {}", id, paymentAllocationDTO);
        if (paymentAllocationDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, paymentAllocationDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!paymentAllocationRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<PaymentAllocationDTO> result = paymentAllocationService.partialUpdate(paymentAllocationDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, paymentAllocationDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /payment-allocations} : get all the Payment Allocations.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of Payment Allocations in body.
     */
    @GetMapping("")
    public List<PaymentAllocationDTO> getAllPaymentAllocations() {
        LOG.debug("REST request to get all PaymentAllocations");
        return paymentAllocationService.findAll();
    }

    /**
     * {@code GET  /payment-allocations/by-business/:businessId} : get all Payment Allocations for a business.
     *
     * Used by frontend to attach allocations to payments.
     *
     * @param businessId the business id.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list in body.
     */
    @GetMapping("/by-business/{businessId}")
    public List<PaymentAllocationDTO> getAllPaymentAllocationsByBusiness(@PathVariable("businessId") Long businessId) {
        LOG.debug("REST request to get PaymentAllocations by businessId: {}", businessId);
        return paymentAllocationService.findAllByBusinessId(businessId);
    }

    /**
     * {@code GET  /payment-allocations/:id} : get the "id" paymentAllocation.
     *
     * @param id the id of the paymentAllocationDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the paymentAllocationDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentAllocationDTO> getPaymentAllocation(@PathVariable("id") Long id) {
        LOG.debug("REST request to get PaymentAllocation : {}", id);
        Optional<PaymentAllocationDTO> paymentAllocationDTO = paymentAllocationService.findOne(id);
        return ResponseUtil.wrapOrNotFound(paymentAllocationDTO);
    }

    /**
     * {@code DELETE  /payment-allocations/:id} : delete the "id" paymentAllocation.
     *
     * @param id the id of the paymentAllocationDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaymentAllocation(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete PaymentAllocation : {}", id);
        paymentAllocationService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}

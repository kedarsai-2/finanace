package com.finance.app.web.rest;

import com.finance.app.repository.PurchaseRepository;
import com.finance.app.service.PurchaseLineService;
import com.finance.app.service.PurchaseQueryService;
import com.finance.app.service.PurchaseService;
import com.finance.app.service.criteria.PurchaseCriteria;
import com.finance.app.service.dto.PurchaseDTO;
import com.finance.app.service.dto.PurchaseLineDTO;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.finance.app.domain.Purchase}.
 */
@RestController
@RequestMapping("/api/purchases")
public class PurchaseResource {

    private static final Logger LOG = LoggerFactory.getLogger(PurchaseResource.class);

    private static final String ENTITY_NAME = "purchase";

    @Value("${jhipster.clientApp.name:backend}")
    private String applicationName;

    private final PurchaseService purchaseService;

    private final PurchaseRepository purchaseRepository;

    private final PurchaseQueryService purchaseQueryService;

    private final PurchaseLineService purchaseLineService;

    public PurchaseResource(
        PurchaseService purchaseService,
        PurchaseRepository purchaseRepository,
        PurchaseQueryService purchaseQueryService,
        PurchaseLineService purchaseLineService
    ) {
        this.purchaseService = purchaseService;
        this.purchaseRepository = purchaseRepository;
        this.purchaseQueryService = purchaseQueryService;
        this.purchaseLineService = purchaseLineService;
    }

    /**
     * {@code POST  /purchases} : Create a new purchase.
     *
     * @param purchaseDTO the purchaseDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new purchaseDTO, or with status {@code 400 (Bad Request)} if the purchase has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<PurchaseDTO> createPurchase(@Valid @RequestBody PurchaseDTO purchaseDTO) throws URISyntaxException {
        LOG.debug("REST request to save Purchase : {}", purchaseDTO);
        if (purchaseDTO.getId() != null) {
            throw new BadRequestAlertException("A new purchase cannot already have an ID", ENTITY_NAME, "idexists");
        }
        purchaseDTO = purchaseService.save(purchaseDTO);
        return ResponseEntity.created(new URI("/api/purchases/" + purchaseDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, purchaseDTO.getId().toString()))
            .body(purchaseDTO);
    }

    /**
     * {@code PUT  /purchases/:id} : Updates an existing purchase.
     *
     * @param id the id of the purchaseDTO to save.
     * @param purchaseDTO the purchaseDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated purchaseDTO,
     * or with status {@code 400 (Bad Request)} if the purchaseDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the purchaseDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseDTO> updatePurchase(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody PurchaseDTO purchaseDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Purchase : {}, {}", id, purchaseDTO);
        if (purchaseDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, purchaseDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!purchaseRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        purchaseDTO = purchaseService.update(purchaseDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, purchaseDTO.getId().toString()))
            .body(purchaseDTO);
    }

    /**
     * {@code PATCH  /purchases/:id} : Partial updates given fields of an existing purchase, field will ignore if it is null
     *
     * @param id the id of the purchaseDTO to save.
     * @param purchaseDTO the purchaseDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated purchaseDTO,
     * or with status {@code 400 (Bad Request)} if the purchaseDTO is not valid,
     * or with status {@code 404 (Not Found)} if the purchaseDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the purchaseDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<PurchaseDTO> partialUpdatePurchase(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody PurchaseDTO purchaseDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Purchase partially : {}, {}", id, purchaseDTO);
        if (purchaseDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, purchaseDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!purchaseRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<PurchaseDTO> result = purchaseService.partialUpdate(purchaseDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, purchaseDTO.getId().toString())
        );
    }

    /**
     * {@code GET /purchases/:id/lines} : get all purchase lines for a purchase.
     *
     * @param id the id of the purchase.
     * @return the list of purchase lines.
     */
    @GetMapping("/{id}/lines")
    public ResponseEntity<List<PurchaseLineDTO>> getPurchaseLines(@PathVariable("id") Long id) {
        LOG.debug("REST request to get PurchaseLines for Purchase : {}", id);
        if (!purchaseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(purchaseLineService.findAllByPurchaseId(id));
    }

    /**
     * {@code GET  /purchases} : get all the Purchases.
     *
     * @param pageable the pagination information.
     * @param criteria the criteria which the requested entities should match.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of Purchases in body.
     */
    @GetMapping("")
    public ResponseEntity<List<PurchaseDTO>> getAllPurchases(
        PurchaseCriteria criteria,
        @org.springdoc.core.annotations.ParameterObject Pageable pageable
    ) {
        LOG.debug("REST request to get Purchases by criteria: {}", criteria);

        Page<PurchaseDTO> page = purchaseQueryService.findByCriteria(criteria, pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /purchases/count} : count all the purchases.
     *
     * @param criteria the criteria which the requested entities should match.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the count in body.
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countPurchases(PurchaseCriteria criteria) {
        LOG.debug("REST request to count Purchases by criteria: {}", criteria);
        return ResponseEntity.ok().body(purchaseQueryService.countByCriteria(criteria));
    }

    /**
     * {@code GET  /purchases/:id} : get the "id" purchase.
     *
     * @param id the id of the purchaseDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the purchaseDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseDTO> getPurchase(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Purchase : {}", id);
        Optional<PurchaseDTO> purchaseDTO = purchaseService.findOne(id);
        return ResponseUtil.wrapOrNotFound(purchaseDTO);
    }

    /**
     * {@code DELETE  /purchases/:id} : delete the "id" purchase.
     *
     * @param id the id of the purchaseDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchase(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Purchase : {}", id);
        purchaseService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
